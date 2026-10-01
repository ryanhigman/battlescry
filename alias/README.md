# bscry Avrae alias

Source of the `!bscry` alias (Draconic). The live copy is edited at avrae.io/dashboard/aliases, not deployed from this repo, so treat this file as a copy: after changing the alias on Avrae, save the new source here too. The version number is in the header comment at the top of the file.

What it does:

- `!bscry` during combat reads the current map, tokens and combatants and replies with a battlescry.com link.
- `!bscry apply ...` takes the command BattleScry copies to the clipboard and writes the changes back (moves, new tokens, effects, map settings, saved tokens and maps).
- `!bscry help` shows usage.

To install it on another Avrae account, create an alias named `bscry` and paste the contents of `bscry.drac2` as the alias body.
