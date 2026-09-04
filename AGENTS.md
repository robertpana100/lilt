# Lilt development

- Organize by domain: composition, arrangement, synthesis, playback, library,
  export, settings, and presentation have distinct owners.
- Keep this repository standalone. Never import or symlink the game repository.
- Preserve seeded composition and synthesis during refactors; characterize changes.
- React with shadcn/ui using Base UI is the frontend stack.
- Treat new instruments as end-to-end features, including arrangement, synthesis,
  playback, export, metadata, controls, and tests.
- Keep styling out of audio mechanics. Cover art receives its colors from the host.
- Preserve existing work and make focused, independently reviewable commits.
- Run targeted tests after each change. Before finishing, run typechecking, tests,
  lint, formatting checks, the production build, and `git diff --check`.
- Do not add CI workflows or save migrations unless requested.
