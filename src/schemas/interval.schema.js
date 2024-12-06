import { z } from "zod";

const intervalSchema = z.union([
  z.literal(0.03),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
