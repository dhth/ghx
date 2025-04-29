use crate::types::OwnerType;
use axum::Json;
use axum::response::{IntoResponse, Response};
use clap::ValueEnum;
use reqwest::Client;

#[derive(Clone, Debug)]
pub struct AppState {
    pub client: Client,
    pub token: String,
    pub config: Config,
}

#[derive(serde::Serialize, Clone, Debug, ValueEnum)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct Config {
    pub owner: Option<String>,
    pub owner_type: OwnerType,
    pub theme: Theme,
}

impl IntoResponse for Config {
    fn into_response(self) -> Response {
        Json(self).into_response()
    }
}
