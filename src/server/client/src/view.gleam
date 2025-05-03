import constants
import gleam/dict
import gleam/int
import gleam/list
import gleam/option
import gleam/result
import gleam/string
import gleam/time/timestamp.{type Timestamp}
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import lustre_http
import types.{type Model, type Msg, type Tag, type Theme, display_model}
import utils.{http_error_to_string}

type TagType {
  Start
  End
}

pub fn view(model: Model) -> element.Element(Msg) {
  html.div([attribute.class("" <> model.config.theme |> main_div_class)], [
    html.div(
      [
        attribute.class(
          "flex flex-col h-screen lg:w-4/5 max-sm:px-2 lg:mx-auto",
        ),
      ],
      [
        model |> debug_section,
        model |> main_section,
        model.state |> navigation_bar(model.config.theme),
      ],
    ),
  ])
}

fn main_div_class(theme: Theme) -> String {
  case theme {
    types.Dark -> "bg-[#282828] text-[#fbf1c7]"
    types.Light -> "bg-[#ffffff] text-[#282828]"
  }
}

fn debug_section(model: Model) -> element.Element(Msg) {
  case model.debug {
    False -> element.none()
    True -> {
      html.div(
        [
          attribute.class(
            "flex-1 overflow-y-scroll mx-4 mt-8 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted max-h-60",
          ),
          attribute.id(types.DebugSection |> types.section_id),
        ],
        [
          html.p(
            [
              attribute.class("text-xl"),
              attribute.id(types.DebugSection |> types.section_heading_id),
            ],
            ["debug" |> element.text],
          ),
          html.div([], [
            html.pre([attribute.class("mt-4 text-wrap ")], [
              model
              |> display_model
              |> element.text,
            ]),
          ]),
        ],
      )
    }
  }
}

fn main_section(model: Model) -> element.Element(Msg) {
  let theme = model.config.theme

  html.div(
    [
      attribute.class("flex-1 overflow-y-scroll pt-8 px-4"),
      attribute.style([
        #("scrollbar-color", theme |> scrollbar_color),
        #("scrollbar-width", "thin"),
      ]),
    ],
    case model.state {
      types.Initial -> [theme |> heading]
      types.ConfigError(error) -> [
        theme |> heading,
        error |> config_error_section(theme),
      ]
      types.ConfigLoaded(maybe_user_name, owner_type, fetching_repos) -> [
        theme |> heading,
        owner_selection_section(
          maybe_user_name,
          owner_type,
          fetching_repos,
          theme,
        ),
        fetching_repos |> fetching_repos_section,
      ]
      types.WithReposError(user_name, owner_type, error) -> [
        theme |> heading,
        owner_selection_section(
          user_name |> option.Some,
          owner_type,
          False,
          theme,
        ),
        error |> repos_error_section(owner_type, theme),
      ]
      types.WithRepos(
        user_name,
        owner_type,
        repos,
        repo_filter_query,
        fetching_tags,
        maybe_selected_repo,
      ) -> [
        theme |> heading,
        owner_selection_section(
          user_name |> option.Some,
          owner_type,
          False,
          theme,
        ),
        repo_selection_section(
          repos,
          repo_filter_query,
          maybe_selected_repo,
          theme,
        ),
        fetching_tags |> fetching_tags_section,
      ]
      types.WithTagsError(
        user_name,
        owner_type,
        repos,
        repo_filter_query,
        selected_repo,
        error,
      ) -> [
        theme |> heading,
        owner_selection_section(
          user_name |> option.Some,
          owner_type,
          False,
          theme,
        ),
        repo_selection_section(
          repos,
          repo_filter_query,
          selected_repo |> option.Some,
          theme,
        ),
        error |> tags_error_section(theme),
      ]
      types.WithTags(
        user_name,
        owner_type,
        repos,
        repo_filter_query,
        selected_repo,
        tags,
        start_tag,
        end_tag,
        fetching_changelog,
      ) -> [
        theme |> heading,
        owner_selection_section(
          user_name |> option.Some,
          owner_type,
          False,
          theme,
        ),
        repo_selection_section(
          repos,
          repo_filter_query,
          selected_repo |> option.Some,
          theme,
        ),
        tags_select_section(tags, start_tag, end_tag, fetching_changelog, theme),
      ]
      types.WithChangesError(
        user_name,
        owner_type,
        repos,
        repo_filter_query,
        selected_repo,
        tags,
        start_tag,
        end_tag,
        error,
      ) -> [
        theme |> heading,
        owner_selection_section(
          user_name |> option.Some,
          owner_type,
          False,
          theme,
        ),
        repo_selection_section(
          repos,
          repo_filter_query,
          selected_repo |> option.Some,
          theme,
        ),
        tags_select_section(
          tags,
          start_tag |> option.Some,
          end_tag |> option.Some,
          False,
          theme,
        ),
        error |> changes_error_section(theme),
      ]
      types.WithChanges(
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
        theme |> heading,
        owner_selection_section(
          user_name |> option.Some,
          owner_type,
          False,
          theme,
        ),
        repo_selection_section(
          repos,
          repo_filter_query,
          selected_repo |> option.Some,
          theme,
        ),
        tags_select_section(
          tags,
          start_tag |> option.Some,
          end_tag |> option.Some,
          False,
          theme,
        ),
        changes.commits
          |> commits_section(
            commits_filter,
            start_tag,
            end_tag,
            case theme {
              types.Dark -> model.author_color_classes.dark
              types.Light -> model.author_color_classes.light
            },
            theme,
          ),
        changes.files
          |> files_section(files_filter, theme),
      ]
    },
  )
}

fn heading(theme: Theme) -> element.Element(Msg) {
  let heading_class = case theme {
    types.Dark -> "text-[#e5d9f2]"
    types.Light -> "text-[#564592]"
  }

  let tooltip_class = case theme {
    types.Dark -> "bg-[#e5d9f2] text-[#282828]"
    types.Light -> "bg-[#282828] text-[#ffffff]"
  }

  html.div([attribute.class("flex gap-4 items-center")], [
    html.p([attribute.class("text-4xl font-semibold " <> heading_class)], [
      "ghch" |> element.text,
    ]),
    case constants.public {
      False -> element.none()
      True ->
        html.div([attribute.class("relative group")], [
          html.p([attribute.class("text-md " <> heading_class)], [
            "(unauthenticated public version)" |> element.text,
          ]),
          html.div(
            [
              attribute.class(
                "absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden w-full group-hover:block text-xs px-2 py-1 text-center "
                <> tooltip_class,
              ),
            ],
            [
              "Github might rate limit you after a while; use the command line version of ghch to make authenticated calls or to fetch non-public data"
              |> element.text,
            ],
          ),
        ])
    },
  ])
}

fn config_error_section(
  error: lustre_http.HttpError,
  theme: Theme,
) -> element.Element(Msg) {
  let error_class = case theme {
    types.Dark -> "text-[#fb4934]"
    types.Light -> "text-[#cc241d]"
  }

  let div_class = case theme {
    types.Dark -> "border-[#fb4934]"
    types.Light -> "border-[#cc241d]"
  }

  html.div(
    [
      attribute.class(
        "mt-4 p-2 border-2 border-opacity-75 border-dotted " <> div_class,
      ),
    ],
    [
      html.p([attribute.class(error_class)], [
        "Error fetching initial config: "
        |> element.text,
      ]),
      html.pre([attribute.class("mt-2 p-1 text-wrap")], [
        element.text(error |> http_error_to_string),
      ]),
    ],
  )
}

fn owner_selection_section(
  user_name: option.Option(String),
  owner_type: types.AccountType,
  fetching_repos: Bool,
  theme: Theme,
) -> element.Element(Msg) {
  let input_class =
    case theme {
      types.Dark -> "text-[#282828] placeholder-[#3d3d3d]"
      types.Light -> "placeholder-[#3d3d3d]"
    }
    <> " "
    <> section_bg_class(types.OwnerSection, theme)

  let button_class = case theme {
    types.Dark -> "bg-[#817ffc] text-[#282828]"
    types.Light -> "bg-[#ada9fd]"
  }

  let placeholder = case owner_type {
    types.Org -> "org name"
    types.User -> "username"
  }

  html.div(
    [
      attribute.class(
        "mt-8 p-4 border-2 border-[#a594f9] border-opacity-50
        border-dotted",
      ),
      attribute.id(types.OwnerSection |> types.section_id),
    ],
    [
      html.p(
        [
          attribute.class("text-xl"),
          attribute.id(types.OwnerSection |> types.section_heading_id),
        ],
        ["owner" |> element.text],
      ),
      html.div([attribute.class("flex flex-wrap gap-2 items-center mt-2")], [
        html.input([
          attribute.class("px-4 py-1 my-2 font-semibold " <> input_class),
          attribute.placeholder(placeholder),
          attribute.value(user_name |> option.unwrap("")),
          attribute.disabled(fetching_repos),
          event.on_input(types.UserEnteredUsernameInput),
        ]),
        html.button(
          [
            attribute.id("fetch-repos"),
            attribute.class(
              "px-4 py-1 font-semibold disabled:bg-[#a89984] " <> button_class,
            ),
            attribute.disabled(
              { user_name |> option.is_none } || fetching_repos,
            ),
            event.on_click(types.UserRequestedRepos),
          ],
          [element.text("fetch repos")],
        ),
        owner_type |> owner_type_selector,
        html.button(
          [event.on_click(types.UserChangedTheme), attribute.class("ml-4 py-1")],
          [element.text(theme |> types.theme_to_string)],
        ),
      ]),
    ],
  )
}

fn section_bg_class(section: types.Section, theme: Theme) -> String {
  case theme {
    types.Dark ->
      case section {
        types.DebugSection -> "bg-[#fabd2f]"
        types.OwnerSection -> "bg-[#a594f9]"
        types.ReposSection -> "bg-[#8caaee]"
        types.TagsSection -> "bg-[#80ed99]"
        types.CommitsSection -> "bg-[#c77dff]"
        types.FilesSection -> "bg-[#affc41]"
      }
    types.Light ->
      case section {
        types.DebugSection -> "bg-[#fabd2f]"
        types.OwnerSection -> "bg-[#cdc1ff]"
        types.ReposSection -> "bg-[#ff9fb2]"
        types.TagsSection -> "bg-[#a4f3b3]"
        types.CommitsSection -> "bg-[#b370e5]"
        types.FilesSection -> "bg-[#7ab02d]"
      }
  }
}

fn owner_type_selector(owner_type: types.AccountType) -> element.Element(Msg) {
  html.div(
    [attribute.class("flex flex-wrap gap-2 items-center ml-2")],
    types.owner_types()
      |> list.map(fn(at) {
        at
        |> owner_type_radio(at == owner_type)
      }),
  )
}

fn owner_type_radio(
  owner_type: types.AccountType,
  checked: Bool,
) -> element.Element(Msg) {
  let id = "owner-selector-" <> owner_type |> types.owner_type_to_string
  html.div([], [
    html.input([
      attribute.name("inline-radio-group"),
      attribute.checked(checked),
      attribute.type_("radio"),
      attribute.id(id),
      event.on_check(fn(_) { types.AccountTypeChanged(owner_type) }),
    ]),
    html.label([attribute.class("ms-2"), attribute.for(id)], [
      html.text(owner_type |> types.owner_type_to_string),
    ]),
  ])
}

fn repos_error_section(
  error: lustre_http.HttpError,
  owner_type: types.AccountType,
  theme: Theme,
) -> element.Element(Msg) {
  let error_class = case theme {
    types.Dark -> "text-[#fb4934]"
    types.Light -> "text-[#cc241d]"
  }

  let div_class = case theme {
    types.Dark -> "border-[#fb4934]"
    types.Light -> "border-[#cc241d]"
  }

  html.div(
    [
      attribute.class(
        "mt-4 p-2 border-2 border-opacity-75 border-dotted " <> div_class,
      ),
    ],
    [
      html.p([attribute.class(error_class)], [
        {
          "Error fetching repos for the "
          <> owner_type
          |> types.owner_type_to_string
          <> ": "
        }
        |> element.text,
      ]),
      html.pre([attribute.class("mt-2 p-1 text-wrap")], [
        element.text(error |> http_error_to_string),
      ]),
    ],
  )
}

fn fetching_repos_section(fetching_repos: Bool) -> element.Element(Msg) {
  case fetching_repos {
    False -> element.none()
    True ->
      html.div(
        [
          attribute.class(
            "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted",
          ),
        ],
        [
          html.p([attribute.class("text-xl")], [
            "fetching repos ..." |> element.text,
          ]),
        ],
      )
  }
}

fn repo_selection_section(
  repos: List(types.Repo),
  maybe_filter_query: option.Option(String),
  maybe_selected_repo: option.Option(String),
  theme: Theme,
) -> element.Element(Msg) {
  let filter_class = types.ReposSection |> section_bg_class(theme)

  html.div(
    [
      attribute.class(
        "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted",
      ),
      attribute.id(types.ReposSection |> types.section_id),
    ],
    [
      html.p(
        [
          attribute.class("text-xl"),
          attribute.id(types.ReposSection |> types.section_heading_id),
        ],
        ["repos" |> element.text],
      ),
      html.input([
        attribute.class(
          "mt-4 font-semibold h-8 text-[#282828] placeholder-[#3d3d3d] pl-2 "
          <> filter_class,
        ),
        attribute.autocomplete("off"),
        attribute.id("filter-repos"),
        attribute.type_("text"),
        attribute.placeholder("filter repos"),
        attribute.value(maybe_filter_query |> option.unwrap("")),
        event.on_input(types.UserEnteredRepoFilterQuery),
      ]),
      html.div(
        [
          attribute.class("flex-wrap mt-2 overflow-y-scroll max-h-60"),
          attribute.style([
            #("scrollbar-color", theme |> scrollbar_color),
            #("scrollbar-width", "thin"),
          ]),
        ],
        case maybe_filter_query {
          option.None -> repos
          option.Some(filter_query) ->
            repos
            |> list.filter(fn(repo) {
              repo.name
              |> string.lowercase
              |> string.contains(filter_query |> string.lowercase)
            })
        }
          |> list.sort(fn(a, b) { string.compare(a.name, b.name) })
          |> list.map(fn(repo) {
            repo_select_button(
              repo,
              maybe_selected_repo
                |> option.map(fn(r) { r == repo.name })
                |> option.unwrap(False),
              theme,
            )
          }),
      ),
    ],
  )
}

fn repo_select_button(
  repo: types.Repo,
  selected: Bool,
  theme,
) -> element.Element(Msg) {
  let class = case theme {
    types.Dark ->
      "text-[#8caaee] disabled:bg-[#8caaee] disabled:text-[#282828] hover:text-[#282828] hover:bg-[#c6d0f5]"
    types.Light -> "text-[#282828] disabled:bg-[#ff9fb2] hover:bg-[#fbdce2]"
  }

  html.button(
    [
      attribute.id("reset-filter"),
      attribute.class(
        "text-sm font-semibold mr-2 px-2 py-1 my-1 text-[#232634] " <> class,
      ),
      attribute.disabled(selected),
      event.on_click(types.RepoChosen(repo.name)),
    ],
    [element.text(repo.name)],
  )
}

fn fetching_tags_section(fetching_tags: Bool) -> element.Element(Msg) {
  case fetching_tags {
    False -> element.none()
    True ->
      html.div(
        [
          attribute.class(
            "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted",
          ),
        ],
        [
          html.p([attribute.class("text-xl")], [
            "fetching tags ..." |> element.text,
          ]),
        ],
      )
  }
}

fn tags_error_section(
  error: lustre_http.HttpError,
  theme: Theme,
) -> element.Element(Msg) {
  let error_class = case theme {
    types.Dark -> "text-[#fb4934]"
    types.Light -> "text-[#cc241d]"
  }

  let div_class = case theme {
    types.Dark -> "border-[#fb4934]"
    types.Light -> "border-[#cc241d]"
  }

  html.div(
    [
      attribute.class(
        "mt-6 p-2 border-2 border-opacity-75 border-dotted " <> div_class,
      ),
    ],
    [
      html.p([attribute.class(error_class)], [
        "Error fetching tags for the repo:" |> element.text,
      ]),
      html.pre([attribute.class("mt-2 p-1 text-wrap")], [
        element.text(error |> http_error_to_string),
      ]),
    ],
  )
}

fn tags_select_section(
  tags: List(Tag),
  start_tag: option.Option(String),
  end_tag: option.Option(String),
  fetching_changelog: Bool,
  theme: Theme,
) -> element.Element(Msg) {
  html.div(
    [
      attribute.class(
        "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted",
      ),
      attribute.id(types.TagsSection |> types.section_id),
    ],
    case tags |> list.length {
      0 -> {
        [
          html.p([attribute.class("text-xl")], [
            "repo has no tags" |> element.text,
          ]),
        ]
      }
      _ -> [
        html.p(
          [
            attribute.class("text-xl"),
            attribute.id(types.TagsSection |> types.section_heading_id),
          ],
          ["tags" |> element.text],
        ),
        html.div(
          [attribute.class("mt-4 flex flex-wrap gap-2 items-center")],
          case start_tag, end_tag {
            option.None, _ -> [
              tags
              |> tag_select(Start, start_tag, theme),
            ]
            option.Some(_), option.None -> [
              tags |> tag_select(Start, start_tag, theme),
              tags
                |> tag_select(End, end_tag, theme),
            ]
            option.Some(_), option.Some(_) -> {
              let button_class =
                "text-[#282828] " <> section_bg_class(types.TagsSection, theme)

              [
                tags
                  |> tag_select(Start, start_tag, theme),
                tags
                  |> tag_select(End, end_tag, theme),
                html.button(
                  [
                    attribute.id("fetch-changes"),
                    attribute.class(
                      "px-4 py-1 font-semibold disabled:bg-[#a89984] "
                      <> button_class,
                    ),
                    attribute.disabled(fetching_changelog),
                    event.on_click(types.UserRequestedChangelog),
                  ],
                  [element.text("fetch changes")],
                ),
              ]
            }
          },
        ),
      ]
    },
  )
}

fn tag_select(
  tags: List(Tag),
  tag_type: TagType,
  selected: option.Option(String),
  theme: Theme,
) -> element.Element(Msg) {
  let select_class = case theme {
    types.Dark -> "bg-[#788bff] text-[#282828]"
    types.Light -> "bg-[#9bb1ff] text-[#282828]"
  }

  html.select(
    [
      attribute.class("py-1 px-2 font-semibold " <> select_class),
      attribute.name("tags"),
      event.on_input(case tag_type {
        End -> types.EndTagChosen
        Start -> types.StartTagChosen
      }),
    ],
    tags
      |> list.map(fn(t) { tag_option(t.name, t.name, selected) })
      |> list.prepend(tag_option(constants.head, constants.head, selected))
      |> list.prepend(tag_option(
        "",
        case tag_type {
          End -> "-- choose end tag --"
          Start -> "-- choose start tag --"
        },
        selected,
      )),
  )
}

fn tag_option(
  value: String,
  label: String,
  selected_value: option.Option(String),
) -> element.Element(Msg) {
  let is_selected =
    selected_value
    |> option.map(fn(s) { s == value })
    |> option.unwrap(False)

  html.option(
    [attribute.value(value), is_selected |> attribute.selected],
    label,
  )
}

fn changes_error_section(
  error: lustre_http.HttpError,
  theme: Theme,
) -> element.Element(Msg) {
  let error_class = case theme {
    types.Dark -> "text-[#fb4934]"
    types.Light -> "text-[#cc241d]"
  }

  let div_class = case theme {
    types.Dark -> "border-[#fb4934]"
    types.Light -> "border-[#cc241d]"
  }

  html.div(
    [
      attribute.class(
        "mt-4 p-2 border-2 border-opacity-75 border-dotted " <> div_class,
      ),
    ],
    [
      html.p([attribute.class(error_class)], [
        "Error fetching changes between the tags:" |> element.text,
      ]),
      html.pre([attribute.class("mt-2 p-1 text-wrap")], [
        element.text(error |> http_error_to_string),
      ]),
    ],
  )
}

fn commits_section(
  commits: List(types.Commit),
  commits_filter_query: option.Option(String),
  start_tag: String,
  end_tag: String,
  author_color_class_store: types.AuthorColorClassStore,
  theme: Theme,
) -> element.Element(Msg) {
  case commits |> list.length {
    0 -> element.none()
    _ ->
      html.div(
        [
          attribute.class(
            "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted",
          ),
          attribute.id(types.CommitsSection |> types.section_id),
        ],
        [
          html.p(
            [
              attribute.class("text-xl"),
              attribute.id(types.CommitsSection |> types.section_heading_id),
            ],
            [{ "commits " <> start_tag <> "..." <> end_tag } |> element.text],
          ),
          html.input([
            attribute.class(
              "mt-4 font-semibold h-8 text-[#232634] placeholder-[#3d3d3d] pl-2 "
              <> section_bg_class(types.CommitsSection, theme),
            ),
            attribute.autocomplete("off"),
            attribute.id("filter-commits"),
            attribute.type_("text"),
            attribute.placeholder("filter commits"),
            attribute.value(commits_filter_query |> option.unwrap("")),
            event.on_input(types.UserEnteredCommitsFilterQuery),
          ]),
          html.div(
            [attribute.class("mt-4 overflow-x-auto")],
            case commits_filter_query {
              option.None -> commits
              option.Some(q) ->
                commits
                |> list.filter(filter_commit_predicate(q))
            }
              |> list.map(fn(commit) {
                commit_details(commit, author_color_class_store, theme)
              }),
          ),
        ],
      )
  }
}

fn filter_commit_predicate(query: String) -> fn(types.Commit) -> Bool {
  fn(commit: types.Commit) {
    {
      commit.details.message
      |> string.lowercase
      |> string.contains(query |> string.lowercase)
    }
    || case commit.details.author {
      option.None -> False
      option.Some(author) ->
        {
          author.name
          |> string.lowercase
          |> string.contains(query |> string.lowercase)
        }
        || {
          author.email
          |> string.lowercase
          |> string.contains(query |> string.lowercase)
        }
    }
  }
}

fn commit_details(
  commit: types.Commit,
  author_color_class_store: types.AuthorColorClassStore,
  theme: Theme,
) -> element.Element(Msg) {
  let #(sha_class, author_class, timestamp_class) = case theme {
    types.Dark -> #(
      "text-[#c77dff]",
      commit.details.author
        |> author_color_class(author_color_class_store, "text-[#ff9500]"),
      "text-[#ff6d44]",
    )
    types.Light -> #(
      "text-[#995f6a]",
      commit.details.author
        |> author_color_class(author_color_class_store, "text-[#941b0c]"),
      "text-[#2ec0f9]",
    )
  }

  let commit_hash = case commit.sha |> string.length {
    n if n >= 8 -> commit.sha |> string.slice(0, 8)
    _ -> commit.sha
  }

  let now = timestamp.system_time()

  let commit_message_heading =
    commit.details.message
    |> string.split("\n")
    |> list.first
    |> result.unwrap(" ")

  html.p([attribute.class("flex gap-6 items-center whitespace-nowrap mt-2")], [
    html.a([attribute.href(commit.html_url), attribute.target("_blank")], [
      html.span([attribute.class(sha_class)], [commit_hash |> element.text]),
    ]),
    html.span([], [commit_message_heading |> element.text]),
    commit.details.author
      |> option.map(fn(author) {
        html.span([attribute.class(author_class)], [author.name |> element.text])
      })
      |> option.unwrap(element.none()),
    commit.details.author
      |> option.then(fn(author) {
        author.authoring_timestamp
        |> option.map(fn(ts) {
          html.span([attribute.class(timestamp_class)], [
            ts
            |> get_commit_relative_time(now)
            |> element.text,
          ])
        })
      })
      |> option.unwrap(element.none()),
  ])
}

fn author_color_class(
  maybe_author: option.Option(types.Author),
  colors: types.AuthorColorClassStore,
  fallback: String,
) -> String {
  case maybe_author {
    option.None -> fallback
    option.Some(author) -> {
      let hash = utils.simple_hash(author.name)
      let num_colors = colors |> dict.size
      let index = hash |> int.remainder(num_colors) |> result.unwrap(0)

      colors |> dict.get(index) |> result.unwrap(fallback)
    }
  }
}

fn get_commit_relative_time(ts: Timestamp, now: Timestamp) -> String {
  { timestamp.difference(ts, now) |> utils.humanize_duration } <> " ago"
}

fn scrollbar_color(theme: Theme) -> String {
  case theme {
    types.Dark -> "#a594f940 #282828"
    types.Light -> "#a594f940 #ffffff"
  }
}

fn files_section(
  maybe_files: option.Option(List(types.ChangesFileItem)),
  files_filter_query: option.Option(String),
  theme: Theme,
) -> element.Element(Msg) {
  case maybe_files {
    option.None -> element.none()
    option.Some([]) -> element.none()
    option.Some(files) -> {
      html.div(
        [
          attribute.class(
            "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted",
          ),
          attribute.style([
            #("scrollbar-color", theme |> scrollbar_color),
            #("scrollbar-width", "thin"),
          ]),
          attribute.id(types.FilesSection |> types.section_id),
        ],
        [
          html.p(
            [
              attribute.class("text-xl"),
              attribute.id(types.FilesSection |> types.section_heading_id),
            ],
            ["files" |> element.text],
          ),
          html.input([
            attribute.class(
              "mt-4 font-semibold h-8 text-[#282828] placeholder-[#3d3d3d] pl-2 "
              <> section_bg_class(types.FilesSection, theme),
            ),
            attribute.autocomplete("off"),
            attribute.id("filter-files"),
            attribute.type_("text"),
            attribute.placeholder("filter files"),
            attribute.value(files_filter_query |> option.unwrap("")),
            event.on_input(types.UserEnteredFilesFilterQuery),
          ]),
          html.div(
            [attribute.class("mt-4 overflow-x-auto")],
            case files_filter_query {
              option.None -> files
              option.Some(q) ->
                files
                |> list.filter(filter_file_predicate(q))
            }
              |> list.map(fn(file) { file_details(file, theme) }),
          ),
        ],
      )
    }
  }
}

fn filter_file_predicate(query: String) -> fn(types.ChangesFileItem) -> Bool {
  fn(file: types.ChangesFileItem) {
    {
      file.file_name
      |> string.lowercase
      |> string.contains(query |> string.lowercase)
    }
  }
}

fn file_details(
  file: types.ChangesFileItem,
  theme: Theme,
) -> element.Element(Msg) {
  html.p([attribute.class("flex gap-4 items-center whitespace-nowrap mt-2")], [
    file.status |> file_status(theme),
    file_change_stats(file.additions, file.deletions, theme),
    html.a([attribute.href(file.blob_url), attribute.target("_blank")], [
      html.span([], [file.file_name |> element.text]),
    ]),
  ])
}

fn file_status(
  status: types.ChangesFileStatus,
  theme: Theme,
) -> element.Element(Msg) {
  let class = case theme {
    types.Dark ->
      case status {
        types.Added -> "bg-[#7cea9c]"
        types.Changed -> "bg-[#fdb3ae]"
        types.Copied -> "bg-[#d0f4de]"
        types.Modified -> "bg-[#ffc300]"
        types.Removed -> "bg-[#ff4365]"
        types.Renamed -> "bg-[#dfa8a9]"
        types.Unchanged -> "bg-[#e5d9f2]"
      }
    types.Light ->
      case status {
        types.Added -> "bg-[#a3f0b9]"
        types.Changed -> "bg-[#fdc9c6]"
        types.Copied -> "bg-[#def7e7]"
        types.Modified -> "bg-[#ffe17f]"
        types.Removed -> "bg-[#ff8ea2]"
        types.Renamed -> "bg-[#ebcacb]"
        types.Unchanged -> "bg-[#efe8f7]"
      }
  }

  html.span(
    [
      attribute.class(
        "px-2 py-1 text-[#282828] text-xs font-semibold " <> class,
      ),
    ],
    [status |> types.file_status_to_string |> element.text],
  )
}

fn file_change_stats(
  additions: Int,
  deletions: Int,
  theme: Theme,
) -> element.Element(Msg) {
  let additions_text = case additions {
    0 -> ""
    n -> "+" <> { n |> int.to_string }
  }

  let deletions_text = case deletions {
    0 -> ""
    n -> "-" <> { n |> int.to_string }
  }

  let #(additions_class, deletions_class) = case theme {
    types.Dark -> #("text-[#affc41]", "text-[#ff4365]")
    types.Light -> #("text-[#068360]", "text-[#cc3550]")
  }

  html.div([attribute.class("flex gap-2")], [
    html.span(
      [
        attribute.class(
          "px-2 py-1 text-sm font-semibold w-16 " <> additions_class,
        ),
      ],
      [additions_text |> element.text],
    ),
    html.span(
      [
        attribute.class(
          "px-2 py-1 text-sm font-semibold w-16 " <> deletions_class,
        ),
      ],
      [deletions_text |> element.text],
    ),
  ])
}

fn navigation_bar(state: types.State, theme: Theme) -> element.Element(Msg) {
  let #(o, r, t, c, f) = case state {
    types.Initial -> #(False, False, False, False, False)
    types.ConfigError(..) -> #(False, False, False, False, False)
    types.ConfigLoaded(..) -> #(True, False, False, False, False)
    types.WithReposError(..) -> #(True, False, False, False, False)
    types.WithRepos(..) -> #(True, True, False, False, False)
    types.WithTagsError(..) -> #(True, True, False, False, False)
    types.WithTags(..) -> #(True, True, True, False, False)
    types.WithChangesError(..) -> #(True, True, True, False, False)
    types.WithChanges(_, _, _, _, _, _, _, _, changes, _, _) ->
      case changes.commits, changes.files {
        [], option.None -> #(True, True, True, False, False)
        [], option.Some([]) -> #(True, True, True, False, False)
        [], option.Some(_) -> #(True, True, True, False, True)
        _, option.None -> #(True, True, True, True, False)
        _, option.Some([]) -> #(True, True, True, True, False)
        _, _ -> #(True, True, True, True, True)
      }
  }

  let footer_class = case theme {
    types.Dark -> "bg-[#282828]"
    types.Light -> "bg-[#ffffff]"
  }

  html.nav(
    [
      attribute.class(
        "flex px-4 pt-4 font-semibold text-[#282828] max-sm:hidden "
        <> footer_class,
      ),
    ],
    [
      html.div(
        [attribute.class("flex gap-2")],
        [
          #(types.OwnerSection, o),
          #(types.ReposSection, r),
          #(types.TagsSection, t),
          #(types.CommitsSection, c),
          #(types.FilesSection, f),
        ]
          |> list.map(fn(data) {
            let #(section, enabled) = data
            navigation_button(section, theme, enabled)
          }),
      ),
    ],
  )
}

fn navigation_button(
  section: types.Section,
  theme: Theme,
  enabled: Bool,
) -> element.Element(Msg) {
  html.button(
    [
      attribute.class(
        section_bg_class(section, theme) <> " disabled:bg-[#a89984] px-2 py-1",
      ),
      attribute.disabled(!enabled),
      event.on_click(types.UserRequestedToGoToSection(section)),
    ],
    [section |> types.section_to_string |> element.text],
  )
}
