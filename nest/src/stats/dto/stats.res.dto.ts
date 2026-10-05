import { FlavorResDto } from '../../flavors/dto/flavor.res.dto';

export class FlavorStatResDto {
  flavor: FlavorResDto;
  // Captions of the flavor that the user picked
  picks: number;
  // Captions of the flavor on the photos that the user voted on
  seen: number;
}

export class StatsResDto {
  // Consecutive campus dates, ending today or yesterday, on which the user finished that date's batch
  streak: number;
  // Photos the user voted on
  votes: number;
  // The user's picks on photos with enough voters for a verdict
  judged: number;
  // The judged picks that have the most picks of their photo
  matches: number;
  flavors: FlavorStatResDto[];
  // Photos the user uploaded
  photos: number;
  // Picks that the captions of the user's photos received
  picksReceived: number;
  // Photos the user may still upload today
  roastsLeft: number;
}
