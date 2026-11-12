#![no_std]
#![cfg_attr(target_arch = "wasm32", no_main)]
#[allow(unused_imports, clippy::single_component_path_imports)]
use transit_passport;

#[cfg(not(target_arch = "wasm32"))]
fn main() {}
