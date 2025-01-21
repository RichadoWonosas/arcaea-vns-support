/* eslint-disable @typescript-eslint/naming-convention */
import { createToken, Lexer } from "chevrotain";

const stringContent = createToken({ name: "String", pattern: /"([^"]|\n|\\")*[^\\]"|""/, line_breaks: true });
const numberContent = createToken({ name: "Number", pattern: /-?[0-9]+(\.[0-9]+)?/ });

const endline = createToken({ name: "Endline", pattern: /(\s*(\r|\n|\r\n))+/, line_breaks: true });
const space = createToken({ name: "Space", pattern: /\s+/, group: Lexer.SKIPPED });
const leftBrace = createToken({ name: "LeftBrace", pattern: /\(/, label: "(" });
const rightBrace = createToken({ name: "RightBrace", pattern: /\)/, label: ")" });
const colon = createToken({ name: "Colon", pattern: /:/, label: ":" });
const comma = createToken({ name: "Comma", pattern: /,/, label: "," });

const fade = createToken({ name: "Fade", pattern: /fade/ });
const show = createToken({ name: "Show", pattern: /show/ });
const hide = createToken({ name: "Hide", pattern: /hide/ });
const scale = createToken({ name: "Scale", pattern: /scale/ });
const move = createToken({ name: "Move", pattern: /move/ });
const play = createToken({ name: "Play", pattern: /play/ });
const stop = createToken({ name: "Stop", pattern: /stop/ });
const volume = createToken({ name: "Volume", pattern: /volume/ });
const say = createToken({ name: "Say", pattern: /say(_legacy)?/ });
const wait = createToken({ name: "Wait", pattern: /wait/ });
const auto = createToken({ name: "Auto", pattern: /auto(play_legacy)?/ });
const hidetextbox = createToken({ name: "HideTextbox", pattern: /hidetextbox/ });
const unloadtextures = createToken({ name: "UnloadTextures", pattern: /unload_textures/ });

const transition = createToken({ name: "Transition", pattern: /linear|(sine|cube|ease)(inout|outin|in|out)/ });
const loop = createToken({ name: "Loop", pattern: /loop/ });
const clear = createToken({ name: "Clear", pattern: /clear/ });
const drawing = createToken({ name: "Drawing", pattern: /normal|overlay/ });

export const vnsToken = { stringContent, numberContent, endline, space, leftBrace, rightBrace, colon, comma, fade, show, hide, scale, move, play, stop, volume, say, wait, auto, hidetextbox, unloadtextures, transition, loop, clear, drawing };
export const vnsLexer = new Lexer([stringContent, numberContent, endline, space, leftBrace, rightBrace, colon, comma, fade, hidetextbox, unloadtextures, show, hide, scale, move, play, stop, volume, say, wait, auto, transition, loop, clear, drawing]);
