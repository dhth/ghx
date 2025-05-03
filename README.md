<p align="center">
  <h1 align="center">ghch</h1>
  <p align="center">
    <a href="https://github.com/dhth/ghch/actions/workflows/build-gleam.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/dhth/ghch/build-gleam.yml?style=flat-square"></a>
  </p>
</p>

`ghch` is a *work-in-progress* tool to simplify the process of viewing changes
for GitHub repositories.

![](https://github.com/user-attachments/assets/548484ac-7d3f-4261-8c59-cb84def173a6)
![](https://github.com/user-attachments/assets/af584b9f-281e-46fd-951f-75278b4d7c9f)
![](https://github.com/user-attachments/assets/74803101-eb63-4837-adac-f3fe9c9c1a76)

> [!NOTE]
> An unauthenticated public version of `ghch`'s web interface is running
> at [https://ghch-public.tools.dhruvs.space](https://ghch-public.tools.dhruvs.space).

⚡️ Usage
---

```text
$ ghch serve -h
Serve ghch' web interface

Usage: ghch serve [OPTIONS]

Options:
  -o, --owner <STRING>       Owner to show results for
  -t, --owner-type <STRING>  Owner type [default: user] [possible values: user, org]
  -T, --theme <STRING>       Theme to use [default: dark] [possible values: light, dark]
  -h, --help                 Print help (see more with '--help')
```

🔑 Authentication
---

You can have `ghch` make authenticated calls to GitHub on your behalf in either
of two ways:

- Have an authenticated instance of [gh](https://github.com/cli/cli) available
  in your `PATH` (recommended).
- Provide a valid Github token via the environment variable `GH_TOKEN`
