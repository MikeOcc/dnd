// THE SEVEN LEVELS — keeping names decent. Account names are checked when
// chosen (server/security.ts); character names are free, but a character's
// name is shown to other players only if it passes here (the echoes of the
// fallen: bloodstains and shades).


/** Names only the game itself may use. */
export const RESERVED = ['admin', 'administrator', 'owner', 'moderator', 'mod', 'system', 'root', 'support', 'staff', 'official',
  'sevenlevels', 'theseven', 'dungeonmaster', 'gamemaster', 'anonymous', 'guest', 'null', 'undefined'];

/** Words a name may not contain anywhere (after undoing l33t-speak).
 * Only words that can't sit innocently inside an ordinary name. */
const BLOCKED = ['fuck', 'shit', 'cunt', 'bitch', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'fagot', 'retard', 'rapist', 'rape',
  'nazi', 'hitler', 'kike', 'spic', 'chink', 'tranny', 'dyke', 'pedo', 'paedo', 'molest', 'porn', 'penis', 'vagina', 'dildo',
  'cock', 'pussy', 'twat', 'wank', 'jizz', 'cum', 'anal', 'kkk', 'heil', 'killall', 'suicide'];
/** Words blocked only as the whole name, or a whole part of it (they hide inside ordinary names). */
const BLOCKED_WORDS = ['ass', 'fag', 'tit', 'tits', 'sex', 'gay', 'hoe', 'nig', 'coon', 'jew'];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g' };

/** Why a username isn't allowed, or null if it is. */
export function usernameProblem(name: string): string | null {
  const lower = name.toLowerCase();
  const plain = [...lower].map(c => LEET[c] ?? c).join('');
  const squashed = plain.replace(/[-_]/g, '').replace(/(.)\1+/g, '$1');   // "f_u_c_k", "fuuuck"
  if (RESERVED.includes(plain.replace(/[-_]/g, ''))) return 'That name is reserved. Please choose another.';
  if (BLOCKED.some(w => plain.replace(/[-_]/g, '').includes(w) || squashed.includes(w))) return 'Please choose a different name.';
  const parts = plain.split(/[-_]|(?<=[a-z])(?=\d)|(?<=\d)(?=[a-z])/).filter(Boolean);
  if (parts.some(p => BLOCKED_WORDS.includes(p)) || BLOCKED_WORDS.includes(plain)) return 'Please choose a different name.';
  return null;
}

/** Whether a character's name is decent enough to show to other players
 * (no blocked words; the reserved account names don't matter here). */
export function nameIsDecent(name: string): boolean {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return false;
  const p = usernameProblem(parts.join('-'));
  return p === null || p.startsWith('That name is reserved');
}
