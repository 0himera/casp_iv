use odra::prelude::*;

pub const MAX_APPROVAL_TTL_MS: u64 = 30 * 24 * 60 * 60 * 1000;
pub type Digest = [u8; 32];

#[odra::odra_type]
pub enum Role {
    Logistician,
    Carrier,
    Clearance,
}

#[odra::odra_type]
pub enum Status {
    Collecting,
    Blocked,
    Ready,
}

#[odra::odra_type]
pub struct VersionHeader {
    pub documents_hash: Digest,
    pub route_hash: Digest,
    pub created_at_ms: u64,
}

#[odra::odra_type]
pub struct Decision {
    pub approved: bool,
    pub decided_at_ms: u64,
    pub valid_until_ms: u64,
    pub revoked_at_ms: Option<u64>,
}

#[odra::odra_type]
pub struct PassportView {
    pub shipment_id: Digest,
    pub version: u32,
    pub current_version: u32,
    pub header: VersionHeader,
    pub logistician: Address,
    pub carrier: Address,
    pub clearance: Address,
    pub logistician_decision: Option<Decision>,
    pub carrier_decision: Option<Decision>,
    pub clearance_decision: Option<Decision>,
    pub status: Status,
    pub evaluated_at_ms: u64,
    pub ready_until_ms: Option<u64>,
}

#[odra::odra_error]
pub enum Error {
    DuplicateActors = 1,
    Unauthorized = 2,
    InvalidDigest = 3,
    AlreadyExists = 4,
    NotFound = 5,
    StaleVersion = 6,
    VersionOverflow = 7,
    AlreadyDecided = 8,
    InvalidExpiry = 9,
    NoActiveApproval = 10,
}

#[odra::event]
pub struct PassportCreated {
    pub shipment_id: Digest,
    pub version: u32,
    pub actor: Address,
    pub documents_hash: Digest,
    pub route_hash: Digest,
    pub block_time_ms: u64,
}

#[odra::event]
pub struct PassportRevised {
    pub shipment_id: Digest,
    pub version: u32,
    pub actor: Address,
    pub documents_hash: Digest,
    pub route_hash: Digest,
    pub block_time_ms: u64,
}

#[odra::event]
pub struct Attested {
    pub shipment_id: Digest,
    pub version: u32,
    pub actor: Address,
    pub role: Role,
    pub approved: bool,
    pub valid_until_ms: u64,
    pub block_time_ms: u64,
}

#[odra::event]
pub struct ApprovalRevoked {
    pub shipment_id: Digest,
    pub version: u32,
    pub actor: Address,
    pub role: Role,
    pub block_time_ms: u64,
}

#[odra::module(events = [PassportCreated, PassportRevised, Attested, ApprovalRevoked])]
pub struct TransitPassport {
    logistician: Var<Address>,
    carrier: Var<Address>,
    clearance: Var<Address>,
    current_versions: Mapping<Digest, u32>,
    versions: Mapping<(Digest, u32), VersionHeader>,
    decisions: Mapping<(Digest, u32, Role), Decision>,
}

#[odra::module]
impl TransitPassport {
    pub fn init(&mut self, logistician: Address, carrier: Address, clearance: Address) {
        if logistician == carrier || logistician == clearance || carrier == clearance {
            self.env().revert(Error::DuplicateActors);
        }
        self.logistician.set(logistician);
        self.carrier.set(carrier);
        self.clearance.set(clearance);
    }

    pub fn create(&mut self, shipment_id: Digest, documents_hash: Digest, route_hash: Digest) {
        self.assert_logistician();
        self.validate_digests(shipment_id, documents_hash, route_hash);
        if self.current_versions.get(&shipment_id).is_some() {
            self.env().revert(Error::AlreadyExists);
        }
        self.write_version(shipment_id, 1, documents_hash, route_hash);
        self.env().emit_native_event(PassportCreated {
            shipment_id,
            version: 1,
            actor: self.env().caller(),
            documents_hash,
            route_hash,
            block_time_ms: self.env().get_block_time(),
        });
    }

    pub fn revise(
        &mut self,
        shipment_id: Digest,
        expected_version: u32,
        documents_hash: Digest,
        route_hash: Digest,
    ) {
        self.assert_logistician();
        self.assert_current(shipment_id, expected_version);
        self.validate_digests(shipment_id, documents_hash, route_hash);
        let version = expected_version
            .checked_add(1)
            .unwrap_or_revert_with(&self.env(), Error::VersionOverflow);
        self.write_version(shipment_id, version, documents_hash, route_hash);
        self.env().emit_native_event(PassportRevised {
            shipment_id,
            version,
            actor: self.env().caller(),
            documents_hash,
            route_hash,
            block_time_ms: self.env().get_block_time(),
        });
    }

    pub fn attest(
        &mut self,
        shipment_id: Digest,
        expected_version: u32,
        approved: bool,
        valid_until_ms: u64,
    ) {
        let role = self.caller_role();
        self.assert_current(shipment_id, expected_version);
        let key = (shipment_id, expected_version, role.clone());
        if self.decisions.get(&key).is_some() {
            self.env().revert(Error::AlreadyDecided);
        }
        let now = self.env().get_block_time();
        if approved {
            if valid_until_ms <= now || valid_until_ms - now > MAX_APPROVAL_TTL_MS {
                self.env().revert(Error::InvalidExpiry);
            }
        } else if valid_until_ms != 0 {
            self.env().revert(Error::InvalidExpiry);
        }
        self.decisions.set(
            &key,
            Decision {
                approved,
                decided_at_ms: now,
                valid_until_ms,
                revoked_at_ms: None,
            },
        );
        self.env().emit_native_event(Attested {
            shipment_id,
            version: expected_version,
            actor: self.env().caller(),
            role,
            approved,
            valid_until_ms,
            block_time_ms: now,
        });
    }

    pub fn revoke(&mut self, shipment_id: Digest, expected_version: u32) {
        let role = self.caller_role();
        self.assert_current(shipment_id, expected_version);
        let key = (shipment_id, expected_version, role.clone());
        let mut decision = self
            .decisions
            .get(&key)
            .unwrap_or_revert_with(&self.env(), Error::NoActiveApproval);
        let now = self.env().get_block_time();
        if !decision.approved || decision.revoked_at_ms.is_some() || now >= decision.valid_until_ms
        {
            self.env().revert(Error::NoActiveApproval);
        }
        decision.revoked_at_ms = Some(now);
        self.decisions.set(&key, decision);
        self.env().emit_native_event(ApprovalRevoked {
            shipment_id,
            version: expected_version,
            actor: self.env().caller(),
            role,
            block_time_ms: now,
        });
    }

    pub fn get_passport(&self, shipment_id: Digest, version: u32) -> PassportView {
        let current = self.current_version(shipment_id);
        let version = if version == 0 { current } else { version };
        let header = self
            .versions
            .get(&(shipment_id, version))
            .unwrap_or_revert_with(&self.env(), Error::NotFound);
        let logistician_decision = self
            .decisions
            .get(&(shipment_id, version, Role::Logistician));
        let carrier_decision = self.decisions.get(&(shipment_id, version, Role::Carrier));
        let clearance_decision = self.decisions.get(&(shipment_id, version, Role::Clearance));
        let now = self.env().get_block_time();
        let decisions = [
            &logistician_decision,
            &carrier_decision,
            &clearance_decision,
        ];
        let rejected = decisions
            .iter()
            .any(|d| d.as_ref().is_some_and(|d| !d.approved));
        let ready = decisions.iter().all(|d| {
            d.as_ref()
                .is_some_and(|d| d.approved && d.revoked_at_ms.is_none() && now < d.valid_until_ms)
        });
        let status = if rejected {
            Status::Blocked
        } else if ready {
            Status::Ready
        } else {
            Status::Collecting
        };
        let ready_until_ms = if ready {
            decisions
                .iter()
                .filter_map(|d| d.as_ref().map(|d| d.valid_until_ms))
                .min()
        } else {
            None
        };
        PassportView {
            shipment_id,
            version,
            current_version: current,
            header,
            logistician: self.logistician.get().unwrap_or_revert(&self.env()),
            carrier: self.carrier.get().unwrap_or_revert(&self.env()),
            clearance: self.clearance.get().unwrap_or_revert(&self.env()),
            logistician_decision,
            carrier_decision,
            clearance_decision,
            status,
            evaluated_at_ms: now,
            ready_until_ms,
        }
    }

    fn assert_logistician(&self) {
        if self.caller_role() != Role::Logistician {
            self.env().revert(Error::Unauthorized);
        }
    }

    fn caller_role(&self) -> Role {
        let caller = self.env().caller();
        if Some(caller) == self.logistician.get() {
            Role::Logistician
        } else if Some(caller) == self.carrier.get() {
            Role::Carrier
        } else if Some(caller) == self.clearance.get() {
            Role::Clearance
        } else {
            self.env().revert(Error::Unauthorized)
        }
    }

    fn current_version(&self, shipment_id: Digest) -> u32 {
        self.current_versions
            .get(&shipment_id)
            .unwrap_or_revert_with(&self.env(), Error::NotFound)
    }

    fn assert_current(&self, shipment_id: Digest, expected: u32) {
        if self.current_version(shipment_id) != expected {
            self.env().revert(Error::StaleVersion);
        }
    }

    fn validate_digests(&self, id: Digest, docs: Digest, route: Digest) {
        if id == [0; 32] || docs == [0; 32] || route == [0; 32] {
            self.env().revert(Error::InvalidDigest);
        }
    }

    fn write_version(&mut self, id: Digest, version: u32, docs: Digest, route: Digest) {
        self.versions.set(
            &(id, version),
            VersionHeader {
                documents_hash: docs,
                route_hash: route,
                created_at_ms: self.env().get_block_time(),
            },
        );
        self.current_versions.set(&id, version);
    }
}
