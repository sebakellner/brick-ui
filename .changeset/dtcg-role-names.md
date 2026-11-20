---
'@brikka-ui/tokens': minor
---

The `tokens` object no longer keys a role by its theme. `roleLightBgSurface` and
`roleDarkBgSurface` collapse into `roleBgSurface`: a role's name is the semantic name,
identical in both themes, and the theme decides its value. The two role files now declare
the same `role` group, and the dark platforms swap it during the build.
