import type { As } from "hry-types/src/Any/As";
import type { IsNever } from "hry-types/src/Any/IsNever";

// 联合类型的字符串转换为中间为传入连接符字符串,例如 UnionStringJoinToString<['a','b'],'|'> => "a | b"
export type UnionStringJoinToString<StrList extends string[], Sign extends string, result extends string = ""> =
  StrList extends [infer First, ...infer Rest] ? IsNever<Rest> extends true ? `${result}${Sign}${First & string}`
    : UnionStringJoinToString<
      As<Rest, string[]>,
      Sign,
      result extends "" ? `${First & string}` : `${result}${Sign}${First & string}`
    >
    : result;
