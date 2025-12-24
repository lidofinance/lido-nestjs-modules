import { z } from 'zod';

/**
 * Parse Zod Type. If parsing fails - onFail in executed.
 *
 * onFail must throw Error
 */
export const parseAsTypeOrFail = <Output, Def extends z.ZodTypeDef, Input>(
  type: z.ZodType<Output, Def, Input>,
  data: unknown,
  onFail: (error: z.ZodError) => never,
): Output => {
  const res = type.safeParse(data);
  if (res.success) {
    return res.data;
  }

  onFail(res.error);
};
