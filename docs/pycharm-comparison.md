# CharmRun vs. PyCharm Run Configurations

CharmRun brings PyCharm-style named run/debug profiles to VS Code, backed by `.vscode/launch.json`. Based on the current feature set (`README.md`, `FEATURE_SPEC.md`, `src/`), it covers the core loop well: named configs, script/module modes, interpreter resolution, variable expansion, a sidebar tree, and status bar run/debug. PyCharm's run-configuration system goes further in several ways. Below are the five most important gaps identified, two of which CharmRun has since closed.

## 1. Compound / parallel run configurations

PyCharm lets you define a **Compound** configuration that bundles several run configs (e.g. "Run API Server" + "Run Worker" + "Run Frontend") and launches them together with one click, each in its own tab. CharmRun currently runs one configuration at a time — there's no way to group configs or start a multi-process dev stack from a single entry point.

## 2. "Before launch" tasks

PyCharm configurations support a **Before Launch** step list: run another run configuration first, execute an external tool, run a build/compile step, activate a specific environment, or run a script — all automatically before the main process starts. CharmRun now supports this too: every configuration has a **Before Launch** section, persisted as `charmrunPreRun` in `launch.json`, holding an ordered list of steps. A step can run another CharmRun configuration, an external tool (command, arguments, working directory), or a VS Code task; steps can be reordered, enabled, or disabled individually. They execute in order before the launch, and a failing, cancelled, or non-zero-exit step aborts it. Circular references between configurations are detected and reported rather than recursing, and step output is logged to the `CharmRun Before Launch` output channel. PyCharm's build/compile and "activate environment" step types have no direct equivalent, since they map onto JetBrains build-system concepts VS Code does not share.

## 3. Specialized/templated run configurations

PyCharm ships purpose-built templates beyond plain script/module: **pytest/unittest/nose** (with a test-results tree, rerun-failed, and coverage integration), **Django server**, **Flask/FastAPI-aware run**, **Docker/Docker Compose**, and **Attach to Process / Remote debug (SSH interpreter)**. CharmRun only supports generic Script and Module modes — there's no test-runner-aware configuration type or containerized/remote target support.

## 4. Run/Debug process management and history

PyCharm's Run/Debug tool window keeps a history of recent launches, lets you **rerun**, **stop all**, run multiple processes concurrently in separate tabs, and re-run with coverage or a profiler attached. CharmRun launches through VS Code's standard debug session with no dedicated run history, no "stop all", and no coverage/profiler run variants.

## 5. Environment file and per-run environment management

PyCharm supports loading environment variables from a `.env` file (via EnvFile) per configuration, plus "modify options" toggles like storing a config as a project file vs. local-only, or excluding it from version control. CharmRun now supports this too: each configuration has an **Env File** field (`envFile` in `types.ts`) that is passed straight through to `debugpy`'s `envFile` option, on top of the existing explicit key/value pairs and `${env:NAME}` expansion. When you create a new configuration and a `.env` file exists in the workspace root, CharmRun finds it automatically and sets it as the default Env File (`${workspaceFolder}/.env`); you can browse to a different file or clear it. Per-config sharing/visibility controls (project file vs. local-only) are still not supported.

---

*Everything else (naming, script/module targets, interpreter resolution, variable expansion, sidebar/status bar integration) is already at parity with PyCharm's basic run-configuration experience.*
