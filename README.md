<p align="center">
  <h1 align="center">ghx</h1>
  <p align="center">
    <a href="https://github.com/dhth/ghx/actions/workflows/build-gleam.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/dhth/ghx/build-gleam.yml?style=flat-square"></a>
  </p>
</p>

`ghx` provides an alternative to GitHub's UI for viewing commit logs between
git tags.

![](https://tools.dhruvs.space/images/ghx/1.png)
![](https://tools.dhruvs.space/images/ghx/2.png)
![](https://tools.dhruvs.space/images/ghx/3.png)

> [!NOTE]
> An unauthenticated public version of `ghx`'s web interface is running
> at [https://ghx.handytools.store](https://ghx.handytools.store).

🤔 Why does this exist?
---

I often need to view commit logs between two git tags for GitHub hosted
repositories. While GitHub's UI allows comparing refs, doing it for git tags is
a bit tedious. Additionally, comparing tags for multiple repositories involves a
lot of clicks. To simplify this process, I built `ghx`.

Everything that `ghx` does can be achieved locally using `git`; the goal is to
access commit logs quickly without having to clone a repository, or pull
changes, or run `git tag` to discover tags.

⚡️ Usage
---

```text
$ ghx serve -h
Serve ghx's web interface

Usage: ghx serve [OPTIONS]

Options:
  -o, --owner <STRING>       Owner to show results for
  -t, --owner-type <STRING>  Owner type [default: user] [possible values: user, org]
  -T, --theme <STRING>       Theme to use [default: dark] [possible values: light, dark]
  -p, --port <INTEGER>       Port to use
  -s, --skip-opening         Whether to skip opening the front-end in the browser
  -h, --help                 Print help (see more with '--help')
```

🔑 Authentication
---

You can have `ghx` make authenticated calls to GitHub on your behalf in either
of two ways:

- Have an authenticated instance of [gh](https://github.com/cli/cli) available
  in your `PATH` (recommended).
- Provide a valid Github token via the environment variable `GH_TOKEN`
