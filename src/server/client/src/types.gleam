import constants
import gleam/bool
import gleam/dict.{type Dict}
import gleam/dynamic/decode
import gleam/int
import gleam/list
import gleam/option
import gleam/string
import gleam/time/timestamp.{type Timestamp}
import lustre_http
import utils

const author_colors_dark = [
  "text-[#fd780b]", "text-[#a882a7]", "text-[#b798f0]", "text-[#59d412]",
  "text-[#7bcaff]", "text-[#ffb472]", "text-[#00ce48]", "text-[#1edacd]",
  "text-[#a0d845]", "text-[#a681fb]", "text-[#f081de]", "text-[#63bd8f]",
  "text-[#64d97f]", "text-[#90e1ef]", "text-[#ddd601]", "text-[#4896ef]",
  "text-[#e98658]", "text-[#b5d092]", "text-[#9fb9f0]", "text-[#ff6682]",
]

const author_colors_light = [
  "text-[#b34700]", "text-[#5b4a5e]", "text-[#6a4da3]", "text-[#3b7c0d]",
  "text-[#005b99]", "text-[#b35a2e]", "text-[#007a2b]", "text-[#0b8a87]",
  "text-[#6b8f2e]", "text-[#745aaf]", "text-[#a03b8c]", "text-[#3b7c5e]",
  "text-[#3b8a5e]", "text-[#4a8ca3]", "text-[#a39b00]", "text-[#2a5b99]",
  "text-[#a34a2e]", "text-[#6b8f5e]", "text-[#4a6ca3]", "text-[#b33a4d]",
]

pub type AccountType {
  User
  Org
}

pub type Theme {
  Light
  Dark
}

pub type InitialConfig {
  InitialConfig(
    owner: option.Option(String),
    owner_type: AccountType,
    theme: Theme,
  )
}

fn theme_decoder() -> decode.Decoder(Theme) {
  use variant <- decode.then(decode.string)
  case variant {
    "light" -> decode.success(Light)
    "dark" -> decode.success(Dark)
    _ -> decode.failure(Dark, "Theme")
  }
}

fn owner_type_decoder() -> decode.Decoder(AccountType) {
  use variant <- decode.then(decode.string)
  case variant {
    "user" -> decode.success(User)
    "org" -> decode.success(Org)
    _ -> decode.failure(User, "AccountType")
  }
}

pub fn initial_config_decoder() -> decode.Decoder(InitialConfig) {
  use owner <- decode.field("owner", decode.optional(decode.string))
  use owner_type <- decode.field("owner_type", owner_type_decoder())
  use theme <- decode.field("theme", theme_decoder())
  decode.success(InitialConfig(owner:, owner_type:, theme:))
}

pub type Repo {
  Repo(
    id: Int,
    name: String,
    url: String,
    description: option.Option(String),
    language: option.Option(String),
  )
}

pub fn repo_decoder() -> decode.Decoder(Repo) {
  use id <- decode.field("id", decode.int)
  use name <- decode.field("name", decode.string)
  use url <- decode.field("url", decode.string)
  use description <- decode.field("description", decode.optional(decode.string))
  use language <- decode.field("language", decode.optional(decode.string))
  decode.success(Repo(id:, name:, url:, description:, language:))
}

pub type ReposResponse =
  List(Repo)

pub fn repos_response_decoder() -> decode.Decoder(ReposResponse) {
  repo_decoder() |> decode.list
}

pub type Commit {
  Commit(sha: String)
}

fn commit_decoder() -> decode.Decoder(Commit) {
  use sha <- decode.field("sha", decode.string)
  decode.success(Commit(sha:))
}

pub type Tag {
  Tag(name: String, commit: Commit)
}

fn tag_decoder() -> decode.Decoder(Tag) {
  use name <- decode.field("name", decode.string)
  use commit <- decode.field("commit", commit_decoder())
  decode.success(Tag(name:, commit:))
}

pub type TagsResponse =
  List(Tag)

pub fn tags_response_decoder() -> decode.Decoder(TagsResponse) {
  tag_decoder() |> decode.list
}

pub type ChangelogCommitAuthor {
  ChangelogCommitAuthor(
    name: String,
    email: String,
    authoring_timestamp: option.Option(Timestamp),
  )
}

fn optional_timestamp_decoder() -> decode.Decoder(option.Option(Timestamp)) {
  decode.new_primitive_decoder("Timestamp", fn(data) {
    let default = option.None

    case decode.run(data, decode.string) {
      Error(_) -> Ok(default)
      Ok(timestamp_string) ->
        case timestamp.parse_rfc3339(timestamp_string) {
          Error(_) -> Ok(default)
          Ok(t) -> Ok(t |> option.Some)
        }
    }
  })
}

fn changelog_commit_author_decoder() -> decode.Decoder(ChangelogCommitAuthor) {
  use name <- decode.field("name", decode.string)
  use email <- decode.field("email", decode.string)
  use authoring_timestamp <- decode.field("date", optional_timestamp_decoder())
  decode.success(ChangelogCommitAuthor(name:, email:, authoring_timestamp:))
}

pub type ChangelogCommitDetails {
  ChangelogCommitDetails(author: ChangelogCommitAuthor, message: String)
}

fn changelog_commit_details_decoder() -> decode.Decoder(ChangelogCommitDetails) {
  use author <- decode.field("author", changelog_commit_author_decoder())
  use message <- decode.field("message", decode.string)
  decode.success(ChangelogCommitDetails(author:, message:))
}

pub type ChangesFileStatus {
  Added
  Removed
  Modified
  Renamed
  Copied
  Changed
  Unchanged
}

pub fn file_status_to_string(status: ChangesFileStatus) -> String {
  case status {
    Added -> "added"
    Changed -> "changed"
    Copied -> "copied"
    Modified -> "modified"
    Removed -> "removed"
    Renamed -> "renamed"
    Unchanged -> "unchangd"
  }
  |> string.pad_end(8, ".")
}

fn changes_file_status_decoder() -> decode.Decoder(ChangesFileStatus) {
  use variant <- decode.then(decode.string)
  case variant {
    "added" -> decode.success(Added)
    "removed" -> decode.success(Removed)
    "modified" -> decode.success(Modified)
    "renamed" -> decode.success(Renamed)
    "copied" -> decode.success(Copied)
    "changed" -> decode.success(Changed)
    "unchanged" -> decode.success(Unchanged)
    _ -> decode.failure(Unchanged, "ChangesFileStatus")
  }
}

pub type ChangesFileItem {
  CommitFileItem(
    file_name: String,
    status: ChangesFileStatus,
    additions: Int,
    deletions: Int,
    blob_url: String,
  )
}

fn changes_file_item_decoder() -> decode.Decoder(ChangesFileItem) {
  use file_name <- decode.field("filename", decode.string)
  use status <- decode.field("status", changes_file_status_decoder())
  use additions <- decode.field("additions", decode.int)
  use deletions <- decode.field("deletions", decode.int)
  use blob_url <- decode.field("blob_url", decode.string)
  decode.success(CommitFileItem(
    file_name:,
    status:,
    additions:,
    deletions:,
    blob_url:,
  ))
}

pub type ChangelogCommit {
  ChangelogCommit(
    sha: String,
    details: ChangelogCommitDetails,
    html_url: String,
  )
}

fn changelog_commit_decoder() -> decode.Decoder(ChangelogCommit) {
  use sha <- decode.field("sha", decode.string)
  use details <- decode.field("commit", changelog_commit_details_decoder())
  use html_url <- decode.field("html_url", decode.string)
  decode.success(ChangelogCommit(sha:, details:, html_url:))
}

pub type ChangesResponse {
  ChangelogResponse(
    commits: List(ChangelogCommit),
    files: option.Option(List(ChangesFileItem)),
  )
}

pub fn changes_response_decoder() -> decode.Decoder(ChangesResponse) {
  use commits <- decode.field(
    "commits",
    decode.list(changelog_commit_decoder()),
  )
  use files <- decode.field(
    "files",
    decode.optional(decode.list(changes_file_item_decoder())),
  )
  decode.success(ChangelogResponse(commits:, files:))
}

pub fn theme_to_string(theme: Theme) -> String {
  case theme {
    Dark -> "🌙"
    Light -> "☀️"
  }
}

pub fn get_next_theme(current: Theme) -> Theme {
  case current {
    Dark -> Light
    Light -> Dark
  }
}

pub type Config {
  Config(theme: Theme)
}

pub fn owner_types() -> List(AccountType) {
  [User, Org]
}

pub fn owner_type_to_string(owner_type: AccountType) -> String {
  case owner_type {
    Org -> "org"
    User -> "user"
  }
}

pub type State {
  Initial
  ConfigError(error: lustre_http.HttpError)
  ConfigLoaded(
    user_name: option.Option(String),
    owner_type: AccountType,
    fetching_repos: Bool,
  )
  WithReposError(
    user_name: String,
    owner_type: AccountType,
    error: lustre_http.HttpError,
  )
  WithRepos(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    fetching_tags: Bool,
    selected_repo: option.Option(String),
  )
  WithTagsError(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    repo: String,
    error: lustre_http.HttpError,
  )
  WithTags(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    repo: String,
    tags: TagsResponse,
    start_tag: option.Option(String),
    end_tag: option.Option(String),
    fetching_changes: Bool,
  )
  WithChangesError(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    repo: String,
    tags: TagsResponse,
    start_tag: String,
    end_tag: String,
    error: lustre_http.HttpError,
  )
  WithChanges(
    user_name: String,
    owner_type: AccountType,
    repos: ReposResponse,
    repo_filter_query: option.Option(String),
    repo: String,
    tags: TagsResponse,
    start_tag: String,
    end_tag: String,
    changes: ChangesResponse,
    commits_filter: option.Option(String),
    files_filter: option.Option(String),
  )
}

pub type AuthorColorClassStore =
  Dict(Int, String)

pub type AuthorColorClasses {
  AuthorColorClasses(dark: AuthorColorClassStore, light: AuthorColorClassStore)
}

fn get_author_color_classes() -> AuthorColorClasses {
  AuthorColorClasses(
    dark: author_colors_dark
      |> list.index_map(fn(c, i) { #(i, c) })
      |> dict.from_list,
    light: author_colors_light
      |> list.index_map(fn(c, i) { #(i, c) })
      |> dict.from_list,
  )
}

pub type Section {
  OwnerSection
  ReposSection
  TagsSection
  CommitsSection
  FilesSection
}

pub fn section_to_string(section: Section) -> String {
  case section {
    OwnerSection -> "owner"
    ReposSection -> "repos"
    TagsSection -> "tags"
    CommitsSection -> "commits"
    FilesSection -> "files"
  }
}

pub fn section_id(section: Section) -> String {
  { section |> section_to_string } <> "-section"
}

pub type Model {
  Model(
    config: Config,
    state: State,
    author_color_classes: AuthorColorClasses,
    debug: Bool,
  )
}

pub fn init_model() -> Model {
  let author_color_classes = get_author_color_classes()
  case constants.public {
    False ->
      Model(
        config: Config(theme: Dark),
        state: Initial,
        author_color_classes:,
        debug: False,
      )
    True ->
      Model(
        config: Config(theme: Dark),
        state: ConfigLoaded(
          user_name: "dhth" |> option.Some,
          owner_type: User,
          fetching_repos: True,
        ),
        author_color_classes:,
        debug: False,
      )
  }
}

pub type Msg {
  InitialConfigFetched(Result(InitialConfig, lustre_http.HttpError))
  UserChangedTheme
  AccountTypeChanged(AccountType)
  UserEnteredUsernameInput(String)
  UserRequestedRepos
  ReposFetched(Result(ReposResponse, lustre_http.HttpError))
  UserEnteredRepoFilterQuery(String)
  RepoChosen(String)
  TagsFetched(#(String, Result(TagsResponse, lustre_http.HttpError)))
  StartTagChosen(String)
  EndTagChosen(String)
  UserRequestedChangelog
  ChangesFetched(
    #(String, String, Result(ChangesResponse, lustre_http.HttpError)),
  )
  UserRequestedToGoToSection(Section)
  UserEnteredCommitsFilterQuery(String)
  UserEnteredFilesFilterQuery(String)
}

pub fn display_config(config: Config) -> String {
  "- theme: " <> config.theme |> theme_to_string
}

pub fn display_model(model: Model) -> String {
  let state_info = case model.state {
    Initial -> ["- state: Initial"]
    ConfigError(error) -> ["- error: " <> error |> utils.http_error_to_string]
    ConfigLoaded(user_name, owner_type, fetching_repos) -> [
      "- state: ConfigLoaded",
      "- user_name: " <> user_name |> string.inspect,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- fetching repos: " <> fetching_repos |> bool.to_string,
    ]
    WithReposError(user_name, owner_type, error) -> [
      "- state: WithReposError",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- error: " <> error |> utils.http_error_to_string,
    ]
    WithRepos(
      user_name,
      owner_type,
      repos,
      repo_filter_query,
      fetching_tags,
      selected_repo,
    ) -> [
      "- state: WithRepos",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- fetching_tags: " <> fetching_tags |> bool.to_string,
      "- selected_repo: " <> selected_repo |> string.inspect,
    ]
    WithTagsError(user_name, owner_type, repos, repo_filter_query, repo, error) -> [
      "- state: WithTagsError",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- selected_repo: " <> repo,
      "- error: " <> error |> utils.http_error_to_string,
    ]
    WithTags(
      user_name,
      owner_type,
      repos,
      repo_filter_query,
      repo,
      tags,
      start_tag,
      end_tag,
      fetching_changes,
    ) -> [
      "- state: WithTags",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- selected_repo: " <> repo,
      "- tags: " <> tags |> list.length |> int.to_string,
      "- start_tag: " <> start_tag |> string.inspect,
      "- end_tag: " <> end_tag |> string.inspect,
      "- fetching_changes: " <> fetching_changes |> bool.to_string,
    ]
    WithChangesError(
      user_name,
      owner_type,
      repos,
      repo_filter_query,
      repo,
      tags,
      start_tag,
      end_tag,
      error,
    ) -> [
      "- state: WithChangesError",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- selected_repo: " <> repo,
      "- tags: " <> tags |> list.length |> int.to_string,
      "- start_tag: " <> start_tag,
      "- end_tag: " <> end_tag,
      "- error: " <> error |> utils.http_error_to_string,
    ]
    WithChanges(
      user_name,
      owner_type,
      repos,
      repo_filter_query,
      selected_repo,
      tags,
      start_tag,
      end_tag,
      changes,
      commits_filter,
      files_filter,
    ) -> [
      "- state: WithChanges",
      "- user_name: " <> user_name,
      "- owner_type: " <> owner_type |> owner_type_to_string,
      "- repos: " <> repos |> list.length |> int.to_string,
      "- repo filter query: " <> repo_filter_query |> string.inspect,
      "- selected_repo: " <> selected_repo,
      "- tags: " <> tags |> list.length |> int.to_string,
      "- start_tag: " <> start_tag,
      "- end_tag: " <> end_tag,
      "- commits: " <> changes.commits |> list.length |> int.to_string,
      "- files: "
        <> changes.files |> option.unwrap([]) |> list.length |> int.to_string,
      "- commits_filter: " <> commits_filter |> string.inspect,
      "- files_filter: " <> files_filter |> string.inspect,
    ]
  }

  [model.config |> display_config]
  |> list.append(state_info)
  |> string.join("\n")
}
