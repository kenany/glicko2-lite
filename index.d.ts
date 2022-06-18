declare module 'glicko2-lite' {
  export = (
    rating: number,
    rd: number,
    vol: number,
    opponents: [
      number, // rating
      number, // rd
      number // score 0..1
    ][],
    options?: {
      rating?: number,
      tau?: number
    }
  ) => ({
    rating: number,
    rd: number,
    vol: number
  });
}
