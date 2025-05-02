import constants
import effects.{fetch_changes, fetch_repos, fetch_tags}
import gleam/option
import gleam/string
import lustre/effect
import types.{type Model, type Msg, Config, Model, get_next_theme}

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  let zero = #(model, effect.none())
  let state = model.state

  case msg {
    types.InitialConfigFetched(result) ->
      case result {
        Error(e) -> #(
          Model(..model, state: types.ConfigError(e)),
          effect.none(),
        )
        Ok(initial_config) ->
          case initial_config {
            types.InitialConfig(maybe_owner, owner_type, theme) -> #(
              Model(
                ..model,
                state: types.ConfigLoaded(
                  user_name: maybe_owner,
                  owner_type:,
                  fetching_repos: maybe_owner |> option.is_some,
                ),
                config: Config(theme:),
              ),
              case maybe_owner {
                option.None -> effect.none()
                option.Some(user_name) -> fetch_repos(user_name, owner_type)
              },
            )
          }
      }
    types.UserChangedTheme -> {
      let config = model.config
      #(
        Model(
          ..model,
          config: Config(
            theme: config.theme
            |> get_next_theme,
          ),
        ),
        effect.none(),
      )
    }
    types.AccountTypeChanged(owner_type) -> {
      case state {
        types.ConfigLoaded(user_name, _, _) -> #(
          Model(
            ..model,
            state: types.ConfigLoaded(
              user_name:,
              owner_type: owner_type,
              fetching_repos: False,
            ),
          ),
          effect.none(),
        )
        types.WithChanges(user_name, owner_type, ..)
        | types.WithChangesError(user_name, owner_type, ..)
        | types.WithRepos(user_name, owner_type, ..)
        | types.WithReposError(user_name, owner_type, ..)
        | types.WithTags(user_name, owner_type, ..)
        | types.WithTagsError(user_name, owner_type, ..) -> #(
          Model(
            ..model,
            state: types.ConfigLoaded(
              user_name: user_name |> option.Some,
              owner_type: owner_type,
              fetching_repos: False,
            ),
          ),
          effect.none(),
        )
        _ -> zero
      }
    }
    types.UserEnteredUsernameInput(uname) -> {
      let user_name = case uname {
        "https://github.com/" <> u -> u
        u -> u
      }

      case state {
        types.ConfigLoaded(_, owner_type, ..)
        | types.WithChanges(_, owner_type, ..)
        | types.WithChangesError(_, owner_type, ..)
        | types.WithRepos(_, owner_type, ..)
        | types.WithReposError(_, owner_type, ..)
        | types.WithTags(_, owner_type, ..)
        | types.WithTagsError(_, owner_type, ..) -> #(
          Model(
            ..model,
            state: types.ConfigLoaded(
              user_name: user_name |> option.Some,
              owner_type: owner_type,
              fetching_repos: False,
            ),
          ),
          effect.none(),
        )
        types.Initial | types.ConfigError(_) -> zero
      }
    }
    types.UserRequestedRepos ->
      case state {
        types.ConfigLoaded(maybe_user_name, owner_type, fetching_repos) ->
          case maybe_user_name, fetching_repos {
            _, True -> zero
            option.None, _ -> zero
            option.Some(user_name), _ -> #(
              Model(
                ..model,
                state: types.ConfigLoaded(
                  user_name: user_name |> option.Some,
                  owner_type: owner_type,
                  fetching_repos: True,
                ),
              ),
              user_name |> fetch_repos(owner_type),
            )
          }
        types.WithChanges(user_name, owner_type, ..)
        | types.WithChangesError(user_name, owner_type, ..)
        | types.WithRepos(user_name, owner_type, ..)
        | types.WithReposError(user_name, owner_type, ..)
        | types.WithTags(user_name, owner_type, ..)
        | types.WithTagsError(user_name, owner_type, ..) -> #(
          Model(
            ..model,
            state: types.ConfigLoaded(
              user_name: user_name |> option.Some,
              owner_type: owner_type,
              fetching_repos: True,
            ),
          ),
          user_name |> fetch_repos(owner_type),
        )
        types.ConfigError(_) | types.Initial -> zero
      }

    types.ReposFetched(r) ->
      case state {
        types.ConfigLoaded(maybe_user_name, owner_type, fetching_repos) ->
          case maybe_user_name, fetching_repos {
            _, False -> zero
            option.None, _ -> zero
            option.Some(user_name), True ->
              case r {
                Error(error) -> #(
                  Model(
                    ..model,
                    state: types.WithReposError(user_name:, owner_type:, error:),
                  ),
                  effect.none(),
                )
                Ok(repos) -> #(
                  Model(
                    ..model,
                    state: types.WithRepos(
                      user_name:,
                      owner_type:,
                      repos:,
                      repo_filter_query: option.None,
                      fetching_tags: False,
                      selected_repo: option.None,
                    ),
                  ),
                  effect.none(),
                )
              }
          }
        _ -> zero
      }
    types.UserEnteredRepoFilterQuery(filter) -> {
      let query = case filter |> string.trim |> string.length {
        0 -> option.None
        _ -> filter |> option.Some
      }

      let updated_model = case state {
        types.WithRepos(..) ->
          Model(
            ..model,
            state: types.WithRepos(..state, repo_filter_query: query),
          )
        types.WithTagsError(..) ->
          Model(
            ..model,
            state: types.WithTagsError(..state, repo_filter_query: query),
          )
        types.WithTags(..) ->
          Model(
            ..model,
            state: types.WithTags(..state, repo_filter_query: query),
          )
        types.WithChangesError(..) ->
          Model(
            ..model,
            state: types.WithChangesError(..state, repo_filter_query: query),
          )
        types.WithChanges(..) ->
          Model(
            ..model,
            state: types.WithChanges(..state, repo_filter_query: query),
          )
        _ -> model
      }

      #(updated_model, effect.none())
    }
    types.RepoChosen(repo) ->
      case repo |> string.length {
        0 ->
          case state {
            types.WithChanges(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              ..,
            )
            | types.WithChangesError(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                ..,
              )
            | types.WithRepos(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                ..,
              )
            | types.WithTags(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                ..,
              )
            | types.WithTagsError(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                ..,
              ) -> #(
              Model(
                ..model,
                state: types.WithRepos(
                  user_name:,
                  owner_type:,
                  repos:,
                  repo_filter_query:,
                  selected_repo: repo |> option.Some,
                  fetching_tags: True,
                ),
              ),
              effect.none(),
            )
            _ -> zero
          }
        _ ->
          case state {
            types.WithRepos(user_name, owner_type, repos, repo_filter_query, ..)
            | types.WithTagsError(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                ..,
              )
            | types.WithTags(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                ..,
              )
            | types.WithChangesError(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                ..,
              )
            | types.WithChanges(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                ..,
              ) -> #(
              Model(
                ..model,
                state: types.WithRepos(
                  user_name:,
                  owner_type:,
                  repos:,
                  repo_filter_query:,
                  selected_repo: repo |> option.Some,
                  fetching_tags: True,
                ),
              ),
              fetch_tags(user_name, repo),
            )

            _ -> zero
          }
      }
    types.TagsFetched(#(repo, result)) ->
      case state {
        types.WithRepos(user_name, owner_type, repos, repo_filter_query, ..) ->
          case result {
            Error(error) -> #(
              Model(
                ..model,
                state: types.WithTagsError(
                  user_name:,
                  owner_type:,
                  repos:,
                  repo_filter_query:,
                  repo:,
                  error:,
                ),
              ),
              effect.none(),
            )
            Ok(tags) -> #(
              Model(
                ..model,
                state: types.WithTags(
                  user_name:,
                  owner_type:,
                  repos:,
                  repo_filter_query:,
                  repo:,
                  tags:,
                  start_tag: option.None,
                  end_tag: option.None,
                  fetching_changes: False,
                ),
              ),
              effect.none(),
            )
          }
        _ -> zero
      }
    types.StartTagChosen(tag) ->
      case state {
        types.WithTags(
          user_name,
          owner_type,
          repos,
          repo_filter_query,
          repo,
          tags,
          _,
          end_tag,
          _,
        ) -> #(
          Model(
            ..model,
            state: types.WithTags(
              user_name:,
              owner_type:,
              repos:,
              repo_filter_query:,
              repo:,
              tags:,
              start_tag: case tag |> string.length {
                0 -> option.None
                _ -> tag |> option.Some
              },
              end_tag: end_tag |> option.or(constants.head |> option.Some),
              fetching_changes: False,
            ),
          ),
          effect.none(),
        )
        types.WithChangesError(
          user_name,
          owner_type,
          repos,
          repo_filter_query,
          repo,
          tags,
          _,
          end_tag,
          _,
        )
        | types.WithChanges(
            user_name,
            owner_type,
            repos,
            repo_filter_query,
            repo,
            tags,
            _,
            end_tag,
            ..,
          ) -> #(
          Model(
            ..model,
            state: types.WithTags(
              user_name:,
              owner_type:,
              repos:,
              repo_filter_query:,
              repo:,
              tags:,
              start_tag: case tag |> string.length {
                0 -> option.None
                _ -> tag |> option.Some
              },
              end_tag: end_tag |> option.Some,
              fetching_changes: False,
            ),
          ),
          effect.none(),
        )
        _ -> zero
      }
    types.EndTagChosen(tag) ->
      case state {
        types.WithTags(
          user_name,
          owner_type,
          repos,
          repo_filter_query,
          repo,
          tags,
          start_tag,
          _,
          _,
        ) -> #(
          Model(
            ..model,
            state: types.WithTags(
              user_name:,
              owner_type:,
              repos:,
              repo_filter_query:,
              repo:,
              tags:,
              start_tag:,
              end_tag: case tag |> string.length {
                0 -> option.None
                _ -> tag |> option.Some
              },
              fetching_changes: False,
            ),
          ),
          effect.none(),
        )
        types.WithChangesError(
          user_name,
          owner_type,
          repos,
          repo_filter_query,
          repo,
          tags,
          start_tag,
          _,
          _,
        )
        | types.WithChanges(
            user_name,
            owner_type,
            repos,
            repo_filter_query,
            repo,
            tags,
            start_tag,
            ..,
          ) -> #(
          Model(
            ..model,
            state: types.WithTags(
              user_name:,
              owner_type:,
              repos:,
              repo_filter_query:,
              repo:,
              tags:,
              start_tag: start_tag |> option.Some,
              end_tag: case tag |> string.length {
                0 -> option.None
                _ -> tag |> option.Some
              },
              fetching_changes: False,
            ),
          ),
          effect.none(),
        )
        _ -> zero
      }
    types.UserRequestedChangelog ->
      case state {
        types.WithTags(user_name, _, _, _, repo, ..) ->
          case state.start_tag, state.end_tag {
            option.Some(start), option.Some(end) -> #(
              Model(
                ..model,
                state: types.WithTags(..state, fetching_changes: True),
              ),
              fetch_changes(user_name, repo, start, end),
            )
            _, _ -> zero
          }
        _ -> zero
      }
    types.ChangesFetched(#(start_tag, end_tag, result)) ->
      case state {
        types.WithTags(
          user_name,
          owner_type,
          repos,
          repo_filter_query,
          repo,
          tags,
          ..,
        ) ->
          case result {
            Error(error) -> #(
              Model(
                ..model,
                state: types.WithChangesError(
                  user_name:,
                  owner_type:,
                  repos:,
                  repo_filter_query:,
                  repo:,
                  tags:,
                  start_tag:,
                  end_tag:,
                  error:,
                ),
              ),
              effect.none(),
            )
            Ok(changes) -> #(
              Model(
                ..model,
                state: types.WithChanges(
                  user_name:,
                  owner_type:,
                  repos:,
                  repo_filter_query:,
                  repo:,
                  tags:,
                  start_tag:,
                  end_tag:,
                  changes:,
                  commits_filter: option.None,
                  files_filter: option.None,
                ),
              ),
              effects.scroll_element_into_view(
                types.CommitsSection |> types.section_id,
              ),
            )
          }
        _ -> zero
      }
    types.UserRequestedToGoToSection(section) -> #(
      model,
      section |> types.section_id |> effects.scroll_element_into_view,
    )
    types.UserEnteredCommitsFilterQuery(query) ->
      case state {
        types.WithChanges(..) -> {
          let filter = case query |> string.length {
            0 -> option.None
            _ -> query |> option.Some
          }
          #(
            Model(
              ..model,
              state: types.WithChanges(..state, commits_filter: filter),
            ),
            effect.none(),
          )
        }
        _ -> zero
      }
    types.UserEnteredFilesFilterQuery(query) ->
      case state {
        types.WithChanges(..) -> {
          let filter = case query |> string.length {
            0 -> option.None
            _ -> query |> option.Some
          }
          #(
            Model(
              ..model,
              state: types.WithChanges(..state, files_filter: filter),
            ),
            effect.none(),
          )
        }
        _ -> zero
      }
  }
}
