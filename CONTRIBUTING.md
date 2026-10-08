# Contributing

Open Manus Forge welcomes practical contributions that help people build, research, learn, maintain systems, or solve community problems.

## Good contribution areas

- Skills for research, accessibility, education, civic data, translation, documentation, and software maintenance.
- Connectors for open APIs, issue trackers, Git hosting, calendars, databases, and local files.
- Local-first workflows for low-bandwidth or privacy-sensitive environments.
- Model adapters, GGUF/runtime compatibility, evaluation sets, and reliability tests.
- Desktop usability, keyboard navigation, localization, and packaging.

## Every skill or connector must explain

- What problem it solves.
- What inputs it reads.
- What outputs or side effects it can create.
- Which permissions it needs.
- Which secrets and external services it uses.
- Whether it supports dry-run and offline use.
- How a user can uninstall or disable it.

Do not commit API keys, tokens, model files, personal data, generated credentials, or unexplained binaries.

## Pull request checklist

- Add or update tests where practical.
- Document permissions and data handling.
- Include a safe example.
- Avoid claiming that an agent verified something it did not verify.
- Keep the change focused and reversible.
