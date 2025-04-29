use clap::ValueEnum;

#[derive(Clone, Debug, ValueEnum, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum OwnerType {
    /// For personal accounts
    User,
    /// For organisation accounts
    Org,
}
