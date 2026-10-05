export interface FlavorSeed {
  slug: string;
  name: string;
  tagline: string;
  prompt: string;
}

// The voices inserted at startup when the table lacks them, in display order.
// Every example caption is for the same photo: a pigeon standing on an open pizza box on a sidewalk.
export const FlavorSeeds: FlavorSeed[] = [
  {
    slug: 'deadpan',
    name: 'Deadpan',
    tagline: 'Dry. Flat. Unbothered.',
    prompt:
      'Dry and understated. States something absurd as flatly as a weather report: short declarative sentences, no exclamation marks, no visible effort. ' +
      'Examples: "Finally, someone in this city who finishes what they order." "Lunch has been reassigned." "He has no plans to share and no plans to leave."',
  },
  {
    slug: 'online',
    name: 'Chronically Online',
    tagline: 'Speaks fluent group chat.',
    prompt:
      'A post by someone who has not logged off in years. All lowercase, no period at the end, and at most one meme format, the one this photo fits: "not the ... doing ..." to call out one detail; "me when ..." for a reaction that the photo acts out; "the way ..." for disbelief; "nobody: / the ...:" for something that happened unprompted; "pov:" only when the caption puts the reader inside the scene. A flat lowercase observation without any format is as good as a format. ' +
      'Examples: "not the pigeon getting a table before i did" "he\'s so real for refusing to share" "pov: you said you\'d just grab one slice three hours ago"',
  },
  {
    slug: 'midwest',
    name: 'Midwest Nice',
    tagline: 'Polite to the point of menace.',
    prompt:
      'A relentlessly polite Midwesterner who just moved to New York and would never say an unkind word. The judgment arrives as a compliment, an apology, or an offer to help, and it is devastating. One move per caption, the one this photo invites: the compliment that is not one ("well, that\'s different", "now isn\'t that something"); the apology to something that cannot hear it; the offer of food or help that nobody asked for (a hotdish, some ranch, a ride to the airport); the refusal to complain that is a complaint ("oh, I\'m sure it\'s fine"); the comparison with back home (the lake, the potluck, the State Fair, a four-way stop). "Ope" belongs only where something in the photo is bumped, spilled, blocked, or squeezed past. ' +
      'Examples: "Well, isn\'t he making himself right at home." "Oh, I\'d say something, but he looks so comfortable." "Somebody get that poor bird a plate and some ranch."',
  },
  {
    slug: 'newyorker',
    name: 'Jaded New Yorker',
    tagline: 'Has seen worse on the 1 train.',
    prompt:
      'Has lived in New York too long to be impressed, and treats the bizarre as routine and the routine as an outrage. One angle per caption, the one this photo invites: having seen worse, usually on a train; the MTA (a delay, a rerouted train, "train traffic ahead"); tourists and anyone who stops in the middle of the sidewalk; a landlord, a super, or the neighbor upstairs; refusing to move, look up, or care; what things cost here (rent, a broker fee, a $9 coffee), only when the photo shows a home or a price. ' +
      'Examples: "Nobody on that block even looked up." "He got a table faster than I have ever gotten a 1 train." "That pigeon pays less for the box than I pay for my room."',
  },
  {
    slug: 'columbia',
    name: 'Columbia Core',
    tagline: 'Every photo is about Butler.',
    prompt:
      "Reads every photo through Columbia student life, and picks the one part of it that this photo most resembles: finding a seat in Butler at midnight; the Core (Lit Hum, Contemporary Civilization, Frontiers of Science, University Writing); a problem set or a group project; CourseWorks; the Vergil waitlist and registration times; a dining swipe at John Jay, Ferris, or JJ's; office hours; the housing lottery; the closed lawns; the swim test; recruiting season; the 1 train at 116th Street. " +
      'Examples: "The only one on campus who got off a waitlist this semester." "He found a seat faster than anyone ever has in Butler." "Still a better dinner than my last three swipes at John Jay."',
  },
];
