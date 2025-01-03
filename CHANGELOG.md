# Change Log

All notable changes to the "arcaea-vns-syntax" extension will be documented in this file.

## [Unreleased]

- Hover infos -- Coming up in version 0.1.0

## [0.0.7] - 2025-01-03

- Updated syntax to Arcaea 6.0

## [0.0.6] - 2022-07-31

### Added

- .json file support about Arcaea's stories, including "paths", "entries_*" and "vn" file

### Removed

- Configuration about diagnostics

## [0.0.5] - 2022-07-31

### Added

- Parse result stroage, preparing for hover infos

### Fixed

- Bug about creating a new .vns file
- "-outin" highlighting problem

## [0.0.4] - 2022-07-30

### Fixed

- Bug about show command that do not have a fade function

## [0.0.3] - 2022-07-30

### Added

- Loop start/end point parsing and inspection

### Changed

- Adjusted severity of present errors
- Adjusted file usage check: repetitions now show warning

## [0.0.2] - 2022-07-30

### Added

- File usage check for image and music

### Fixed

- Value check: only the first command of each kind were checked

## [0.0.1] - 2022-07-29

Initial release version of "arcaea-vns-syntax".

### Features

- Syntax highlight
- Basic snippets
- .vns file parsing
- Basic value check
