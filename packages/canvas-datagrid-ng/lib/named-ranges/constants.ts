export const NAMED_RANGE_PATTERN =
  /^\$(?<c1>[A-Z]+|)(?<r1>[0-9]+|)(:\$(?<c2>[A-Z]+|)(?<r2>[0-9]+|)|)$/;

export const NAMED_RANGE_PATTERN_FRIENDLY =
  /^(?<c1>[A-Z]+|)(?<r1>[0-9]+|)(:(?<c2>[A-Z]+|)(?<r2>[0-9]+|)|)$/;
