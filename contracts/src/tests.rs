use crate::passport::*;
use odra::host::{Deployer, HostEnv};

const ID: Digest = [1; 32];
const DOCS: Digest = [2; 32];
const ROUTE: Digest = [3; 32];

fn setup() -> (HostEnv, TransitPassportHostRef) {
    let env = odra_test::env();
    // Deployer is deliberately not one of the three signers.
    env.set_caller(env.get_account(3));
    let contract = TransitPassport::deploy_with_cfg(
        &env,
        TransitPassportInitArgs {
            logistician: env.get_account(0),
            carrier: env.get_account(1),
            clearance: env.get_account(2),
        },
        odra::host::InstallConfig::new::<TransitPassport>(false, false),
    );
    env.set_caller(env.get_account(0));
    (env, contract)
}

fn approve_all(
    env: &HostEnv,
    c: &mut TransitPassportHostRef,
    id: Digest,
    version: u32,
    until: u64,
) {
    for index in 0..3 {
        env.set_caller(env.get_account(index));
        c.attest(id, version, true, until);
    }
}

#[test]
fn three_approvals_ready_until_earliest_expiry() {
    let (env, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    assert_eq!(c.get_passport(ID, 0).status, Status::Collecting);
    for index in 0..3 {
        env.set_caller(env.get_account(index));
        c.attest(ID, 1, true, 1000 + index as u64 * 1000);
        if index < 2 {
            assert_eq!(c.get_passport(ID, 0).status, Status::Collecting);
        }
    }
    let view = c.get_passport(ID, 0);
    assert_eq!(view.status, Status::Ready);
    assert_eq!(view.ready_until_ms, Some(1000));
    assert_eq!(view.logistician, env.get_account(0));
    assert_eq!(view.carrier, env.get_account(1));
    assert_eq!(view.clearance, env.get_account(2));
    assert_eq!(env.native_events_count(&c), 4);
    assert!(env.emitted_native(&c, "PassportCreated"));
    assert!(env.emitted_native(&c, "Attested"));
    assert!(env.emitted_native_event(
        &c,
        Attested {
            shipment_id: ID,
            version: 1,
            actor: env.get_account(2),
            role: Role::Clearance,
            approved: true,
            valid_until_ms: 3000,
            block_time_ms: 0,
        }
    ));
}

#[test]
fn expiry_changes_read_status_without_mutation() {
    let (env, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    approve_all(&env, &mut c, ID, 1, 1000);
    env.advance_block_time(999);
    assert_eq!(c.get_passport(ID, 0).status, Status::Ready);
    env.advance_block_time(1);
    let view = c.get_passport(ID, 0);
    assert_eq!(view.status, Status::Collecting);
    assert_eq!(view.evaluated_at_ms, 1000);
    assert_eq!(view.ready_until_ms, None);
    assert_eq!(view.carrier_decision.unwrap().revoked_at_ms, None);
    assert_eq!(env.native_events_count(&c), 4);
    assert_eq!(
        c.try_attest(ID, 1, true, 2000),
        Err(Error::AlreadyDecided.into())
    );
    assert_eq!(c.try_revoke(ID, 1), Err(Error::NoActiveApproval.into()));
}

#[test]
fn new_version_keeps_history_and_requires_new_approvals() {
    let (env, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    approve_all(&env, &mut c, ID, 1, 1000);
    env.set_caller(env.get_account(0));
    c.revise(ID, 1, [4; 32], ROUTE);
    let current = c.get_passport(ID, 0);
    assert_eq!(current.version, 2);
    assert_eq!(current.header.documents_hash, [4; 32]);
    assert_eq!(current.status, Status::Collecting);
    assert!(current.logistician_decision.is_none());
    let old = c.get_passport(ID, 1);
    assert_eq!(old.header.documents_hash, DOCS);
    assert_eq!(old.status, Status::Ready);
    assert_eq!(old.current_version, 2);
    assert_eq!(
        c.try_attest(ID, 1, true, 1000),
        Err(Error::StaleVersion.into())
    );
    assert_eq!(
        c.try_revise(ID, 1, DOCS, ROUTE),
        Err(Error::StaleVersion.into())
    );
    assert_eq!(c.try_revoke(ID, 1), Err(Error::StaleVersion.into()));
    assert!(env.emitted_native(&c, "PassportRevised"));
}

#[test]
fn revoke_is_terminal_and_only_affects_callers_approval() {
    let (env, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    approve_all(&env, &mut c, ID, 1, 1000);
    env.set_caller(env.get_account(1));
    c.revoke(ID, 1);
    let view = c.get_passport(ID, 0);
    assert_eq!(view.status, Status::Collecting);
    assert_eq!(view.carrier_decision.unwrap().revoked_at_ms, Some(0));
    assert_eq!(view.logistician_decision.unwrap().revoked_at_ms, None);
    assert_eq!(c.try_revoke(ID, 1), Err(Error::NoActiveApproval.into()));
    assert_eq!(
        c.try_attest(ID, 1, true, 1000),
        Err(Error::AlreadyDecided.into())
    );
    assert!(env.emitted_native(&c, "ApprovalRevoked"));
}

#[test]
fn rejection_persists_and_can_only_be_resolved_by_new_version() {
    let (env, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    c.attest(ID, 1, false, 0);
    env.advance_block_time(MAX_APPROVAL_TTL_MS + 1);
    assert_eq!(c.get_passport(ID, 0).status, Status::Blocked);
    assert_eq!(c.try_revoke(ID, 1), Err(Error::NoActiveApproval.into()));
    assert_eq!(
        c.try_attest(ID, 1, true, env.block_time() + 1000),
        Err(Error::AlreadyDecided.into())
    );
    c.revise(ID, 1, DOCS, ROUTE); // explicit renewal with same commitments
    assert_eq!(c.get_passport(ID, 0).status, Status::Collecting);
    approve_all(&env, &mut c, ID, 2, env.block_time() + 1000);
    assert_eq!(c.get_passport(ID, 0).status, Status::Ready);
}

#[test]
fn outsiders_and_deployer_cannot_mutate_or_impersonate() {
    let (env, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    for index in 1..5 {
        env.set_caller(env.get_account(index));
        assert_eq!(
            c.try_create([5; 32], DOCS, ROUTE),
            Err(Error::Unauthorized.into())
        );
        assert_eq!(
            c.try_revise(ID, 1, DOCS, ROUTE),
            Err(Error::Unauthorized.into())
        );
        if index >= 3 {
            assert_eq!(
                c.try_attest(ID, 1, true, 1000),
                Err(Error::Unauthorized.into())
            );
            assert_eq!(c.try_revoke(ID, 1), Err(Error::Unauthorized.into()));
        }
        assert_eq!(c.get_passport(ID, 0).version, 1); // public read
    }
}

#[test]
fn validates_identifiers_versions_and_commitments_atomically() {
    let (_, mut c) = setup();
    assert_eq!(
        c.try_create([0; 32], DOCS, ROUTE),
        Err(Error::InvalidDigest.into())
    );
    assert_eq!(
        c.try_create(ID, [0; 32], ROUTE),
        Err(Error::InvalidDigest.into())
    );
    assert_eq!(
        c.try_create(ID, DOCS, [0; 32]),
        Err(Error::InvalidDigest.into())
    );
    assert_eq!(c.try_attest(ID, 1, true, 1000), Err(Error::NotFound.into()));
    c.create(ID, DOCS, ROUTE);
    assert_eq!(
        c.try_create(ID, DOCS, ROUTE),
        Err(Error::AlreadyExists.into())
    );
    assert_eq!(
        c.try_revise(ID, 0, DOCS, ROUTE),
        Err(Error::StaleVersion.into())
    );
    assert_eq!(
        c.try_revise(ID, 1, DOCS, [0; 32]),
        Err(Error::InvalidDigest.into())
    );
    assert_eq!(c.get_passport(ID, 0).current_version, 1);
    assert_eq!(c.try_get_passport(ID, 2), Err(Error::NotFound.into()));
}

#[test]
fn invalid_expiry_does_not_consume_the_decision_slot() {
    let (env, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    env.advance_block_time(1000);
    for expiry in [0, 999, 1000, 1000 + MAX_APPROVAL_TTL_MS + 1] {
        assert_eq!(
            c.try_attest(ID, 1, true, expiry),
            Err(Error::InvalidExpiry.into())
        );
    }
    assert_eq!(
        c.try_attest(ID, 1, false, 1001),
        Err(Error::InvalidExpiry.into())
    );
    c.attest(ID, 1, true, 1000 + MAX_APPROVAL_TTL_MS);
    assert!(c.get_passport(ID, 0).logistician_decision.unwrap().approved);
}

#[test]
fn decisions_are_isolated_between_shipments() {
    let (env, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    c.create([9; 32], DOCS, ROUTE);
    approve_all(&env, &mut c, ID, 1, 1000);
    assert_eq!(c.get_passport([9; 32], 0).status, Status::Collecting);
    assert!(c.get_passport([9; 32], 0).clearance_decision.is_none());
}

#[test]
fn cannot_revoke_a_missing_approval() {
    let (_, mut c) = setup();
    c.create(ID, DOCS, ROUTE);
    assert_eq!(c.try_revoke(ID, 1), Err(Error::NoActiveApproval.into()));
}

#[test]
fn constructor_rejects_duplicate_actors() {
    let env = odra_test::env();
    let a = env.get_account(0);
    // Test every collision, including equal non-logistician actors.
    for (logistician, carrier, clearance) in [
        (a, a, env.get_account(1)),
        (a, env.get_account(1), a),
        (a, env.get_account(1), env.get_account(1)),
    ] {
        let result = TransitPassport::try_deploy(
            &env,
            TransitPassportInitArgs {
                logistician,
                carrier,
                clearance,
            },
        );
        assert!(matches!(result, Err(error) if error == Error::DuplicateActors.into()));
    }
}
