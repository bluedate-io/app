import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/next";

export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({ mode: "LIVE", deny: ["CATEGORY:AI"] }),
  ],
});

export const protectOtpSend = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 5 }),
);

export const protectOtpVerify = aj.withRule(
  slidingWindow({ mode: "LIVE", interval: 60, max: 10 }),
);
