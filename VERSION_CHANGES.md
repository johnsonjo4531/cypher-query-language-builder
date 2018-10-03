# Version Changes

## v3.0.0

`cql.raw` was removed, because it was dangerous to use outside of parenthesis or square brackets. Added `cql.setters`, `cql.Node` and `cql.Relationship` along with enumerative direction types `cql.dirLeft`, `cql.dirRight`, `cql.dirNone`. Updated `cql.fromProps` to only work if there is a props whitelist.

## v2.1.4

Fixed a bug in `cql.fromProps`

## v2.1.0-v2.1.3

Various documentation updates

## v2.1.0

Forked from Ionut Botizan's [cypher-tagged-templates](https://www.npmjs.com/package/cypher-tagged-templates).
Added features `cql.raw`, `cql.fromProps`
