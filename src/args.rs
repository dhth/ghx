use crate::server::Theme;
use crate::types::OwnerType;
use clap::Parser;
use clap::Subcommand;

#[derive(Parser)]
/// ghx simplifies viewing changes for GitHub repositories
pub struct Args {
    #[command(subcommand)]
    pub command: GhChCommand,
}

#[derive(Subcommand, Debug)]
pub enum GhChCommand {
    /// Serve ghx's web interface
    #[command()]
    Serve {
        /// Owner to show results for
        #[arg(short = 'o', long = "owner", value_name = "STRING")]
        owner: Option<String>,
        /// Owner type
        #[arg(
            short = 't',
            long = "owner-type",
            value_name = "STRING",
            default_value = "user"
        )]
        owner_type: OwnerType,
        /// Theme to use
        #[arg(
            short = 'T',
            long = "theme",
            value_name = "STRING",
            default_value = "dark"
        )]
        theme: Theme,
        /// Port to use
        #[arg(short = 'p', long = "port", value_name = "INTEGER", value_parser=clap::value_parser!(u16).range(1024..=49151))]
        // https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml
        port: Option<u16>,
        /// Whether to skip opening the front-end in the browser
        #[arg(short = 's', long = "skip-opening")]
        skip_opening: bool,
    },
}
