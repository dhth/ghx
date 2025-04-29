<p align="center">
  <h1 align="center">ghch</h1>
  <p align="center">
    <a href="https://github.com/dhth/ghch/actions/workflows/build-gleam.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/dhth/ghch/build-gleam.yml?style=flat-square"></a>
  </p>
</p>

`ghch` is a *work-in-progress* tool to simplify the process of viewing changes
for GitHub repositories.

![image](https://github.com/user-attachments/assets/7b00958f-7023-4e34-bb8a-f996cbe7c0f4)
![image](https://github.com/user-attachments/assets/cb337200-6f4e-46e2-9397-408c1960b4ce)

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
