/**
 * Framework Berlin — Chatbot Knowledge Base
 *
 * Each intent has:
 *   id       — unique slug
 *   phrases  — multi-word strings that trigger a strong match when found in the query
 *   keywords — individual words; matched token-by-token (lower weight than phrases)
 *   response — markdown string rendered in the chat bubble
 *   chips    — quick-reply suggestions shown after this response
 */

export const INTENTS = [
  /* ── GREETING ─────────────────────────────────────────────── */
  {
    id: 'greeting',
    phrases: ['good morning', 'good afternoon', 'good evening', 'hi there', 'hey there'],
    keywords: ['hello', 'hi', 'hey', 'hallo', 'hej', 'howdy', 'sup', 'morning', 'afternoon'],
    response: "Hey! 👋 I'm the Framework Berlin assistant. Ask me anything about our classes, pricing, studio locations, or team. What can I help with?",
    chips: ['What is Lagree?', 'Pricing & Credits', 'Studio Locations', 'First-timer tips'],
  },

  /* ── ABOUT FRAMEWORK ──────────────────────────────────────── */
  {
    id: 'about',
    phrases: ['about framework', 'what is framework', 'who are you', 'tell me about', 'teacher owned', 'teacher-owned', 'boutique studio'],
    keywords: ['about', 'framework', 'boutique', 'teacher', 'owned'],
    response: "**Framework Berlin** is a teacher-owned boutique fitness studio offering:\n\n• **Lagree training** — high-intensity, low-impact workouts on the Megaformer™\n• **Personal training** — 1:1 sessions with certified instructors\n• **Physiotherapy** — clinical care integrated with movement\n\nTwo Berlin studios (Prenzlauer Berg + Kreuzberg), 32+ specialists.",
    chips: ['What is Lagree?', 'Studio Locations', 'Meet the team'],
  },

  /* ── WHAT IS LAGREE ───────────────────────────────────────── */
  {
    id: 'lagree',
    phrases: ['what is lagree', 'how does lagree', 'lagree method', 'the lagree method', 'tell me about lagree', 'explain lagree'],
    keywords: ['lagree', 'megaformer', 'method', 'reformer', 'machine', 'low impact', 'slow twitch', 'workout'],
    response: "**Lagree** is a high-intensity, low-impact strength method performed on the **Megaformer™** machine.\n\nIt targets slow-twitch muscle fibers — building lean muscle and deep core strength while staying gentle on your joints. Every session is **50 minutes**, and the afterburn effect keeps your metabolism elevated for up to **24 hours** after class.",
    chips: ['How is it different from Pilates?', 'Pricing', 'First-timer tips'],
  },

  /* ── LAGREE VS PILATES ────────────────────────────────────── */
  {
    id: 'pilates_diff',
    phrases: ['lagree vs pilates', 'different from pilates', 'compared to pilates', 'same as pilates', 'like pilates', 'pilates difference'],
    keywords: ['pilates', 'difference', 'compare', 'versus', 'vs', 'similar'],
    response: "Lagree uses a Megaformer (similar to a Pilates Reformer) but is a very different experience:\n\n• **Intensity** — far more cardiovascular and muscle-fatiguing than Pilates\n• **Target** — slow-twitch endurance fibers, not just mobility\n• **Afterburn** — metabolism stays elevated up to 24 hours post-class\n• **Both** are low-impact on joints\n\nThink of it as strength training meets cardio, on a Pilates-style machine.",
    chips: ['What is Lagree?', 'First-timer tips', 'Pricing'],
  },

  /* ── STUDIO LOCATIONS ─────────────────────────────────────── */
  {
    id: 'locations',
    phrases: ['where are you', 'studio location', 'where is framework', 'find you', 'prenzlauer berg', 'kreuzberg', 'christinenstrasse', 'oranienstrasse', 'studio address'],
    keywords: ['location', 'address', 'where', 'find', 'pberg', 'xberg', 'kreuzberg', 'prenzlauer', 'christinen', 'oranien', 'studios'],
    response: "We have two Berlin studios:\n\n📍 **Prenzlauer Berg**\nChristinenstraße 19a, 10119 Berlin\n\n📍 **Kreuzberg**\nOranienstraße 185, 10999 Berlin\n\nBoth locations open **Mon–Thu, 8:00am–5:30pm**. All credit packs are valid at either studio.",
    chips: ['Studio hours', 'How to book', 'Pricing'],
  },

  /* ── OPENING HOURS ────────────────────────────────────────── */
  {
    id: 'hours',
    phrases: ['opening hours', 'studio hours', 'what time do you open', 'when are you open', 'are you open on', 'open on friday', 'open on weekend', 'opening time'],
    keywords: ['hours', 'open', 'time', 'when', 'friday', 'weekend', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'close', 'closing'],
    response: "Both studios are open **Monday through Thursday, 8:00am–5:30pm**.\n\nFor specific class times and live availability, check our booking platform — Bsport or ClassPass.",
    chips: ['How to book', 'Studio locations', 'Pricing'],
  },

  /* ── PRICING ──────────────────────────────────────────────── */
  {
    id: 'pricing',
    phrases: ['how much does it cost', 'how much is a class', 'credit pack', 'class prices', 'membership price', 'how much do classes cost', 'what do classes cost'],
    keywords: ['price', 'cost', 'pricing', 'credits', 'pack', 'packs', 'membership', 'euros', 'euro', 'expensive', 'affordable', 'money', 'fee', 'how much'],
    response: "All credit packs — valid at both studios:\n\n**First Timer** — 2 classes · €35 · €17.50/class\n↳ New members only, valid 14 days\n\n**Drop In** — 1 class · €35\n↳ Valid 1 month\n\n**5 Classes** — €160 · €32/class\n↳ Valid 6 months\n\n**10 Classes ⭐** — €290 · €29/class\n↳ Most popular · Valid 6 months\n\n**20 Classes** — €520 · €26/class\n↳ Valid 6 months\n\n**Lagree + Soundbath** — €45",
    chips: ['First-timer tips', 'How to book', 'What is Lagree?'],
  },

  /* ── FIRST TIMER ──────────────────────────────────────────── */
  {
    id: 'first_timer',
    phrases: ['first time', 'first class', 'new member', 'never done lagree', 'never tried lagree', 'what should i bring', 'what to expect', 'first timer', 'joining for the first time'],
    keywords: ['first', 'beginner', 'new', 'never', 'bring', 'wear', 'socks', 'grip', 'expect', 'intro', 'prepare', 'start'],
    response: "Here's everything to know for your first class:\n\n• **Arrive 15 min early** — your instructor will walk you through the Megaformer\n• **Grip socks required** — available to buy in-studio if you don't have them\n• **Wear fitted clothing** — you'll be moving in all directions on the machine\n• **It will be hard** — that's completely normal, even for very fit people!\n\n**First Timer pack**: 2 classes for €35 (new members only, valid 14 days).",
    chips: ['Pricing', 'How to book', 'Studio locations'],
  },

  /* ── BOOKING ──────────────────────────────────────────────── */
  {
    id: 'booking',
    phrases: ['how to book', 'book a class', 'reserve a spot', 'sign up for a class', 'can i book online', 'how do i reserve', 'where to book'],
    keywords: ['book', 'booking', 'reserve', 'sign up', 'bsport', 'classpass', 'online', 'register', 'app'],
    response: "Classes are booked via two platforms:\n\n📱 **Bsport** — our primary platform for all credit packs\n📱 **ClassPass** — for ClassPass members\n\nHead to either platform to see live class availability and book your spot. Credit packs bought on Bsport are valid at both studios.",
    chips: ['Pricing', 'Studio locations', 'First-timer tips'],
  },

  /* ── PHYSIOTHERAPY ────────────────────────────────────────── */
  {
    id: 'physiotherapy',
    phrases: ['physiotherapy', 'physical therapy', 'book physio', 'injury treatment', 'back pain', 'rehabilitation', 'prenatal care', 'postnatal care', 'pregnancy care', 'recovery treatment'],
    keywords: ['physio', 'therapy', 'treatment', 'injury', 'pain', 'rehab', 'rehabilitation', 'prenatal', 'postnatal', 'pregnancy', 'recover', 'recovery', 'lisanne', 'juni', 'manual', 'clinical', 'assessment'],
    response: "We offer integrated **Physiotherapy** at Framework Berlin:\n\n• Medical Assessment\n• Manual Therapy\n• Movement Re-Education\n• Injury Rehabilitation\n• Pregnancy & Postnatal Care\n• Performance Optimization\n\n**Physiotherapy team:**\n• **Lisanne** — 6+ years, B.Sc. International Physiotherapy (Netherlands), high-performance sports & chronic pain\n• **Juni** — Physiotherapist + Lagree Instructor, specializes in prenatal/postnatal care\n\nContact us at hello@frameworkberlin.com to book a consultation.",
    chips: ['Contact the studio', 'Meet the team', 'Personal training'],
  },

  /* ── PERSONAL TRAINING ────────────────────────────────────── */
  {
    id: 'personal_training',
    phrases: ['personal training', 'one on one', '1 on 1', '1:1 session', 'private session', 'private class', 'individual session'],
    keywords: ['personal', 'private', 'individual', 'solo', 'trainer', '1:1'],
    response: "Yes — we offer **personal training** as 1:1 sessions with our instructors. It's a great option for beginners, anyone coming back from injury, or those who want focused technique coaching.\n\nFor availability and pricing, contact the studio directly or check the booking platform.",
    chips: ['How to book', 'Physiotherapy', 'Studio locations'],
  },

  /* ── TEAM ─────────────────────────────────────────────────── */
  {
    id: 'team',
    phrases: ['meet the team', 'who are the instructors', 'instructor profiles', 'who teaches', 'the team', 'about the instructors', 'your trainers'],
    keywords: ['team', 'instructor', 'trainer', 'teacher', 'staff', 'margot', 'celia', 'coach', 'specialists'],
    response: "Framework Berlin has **32+ specialists** across both studios.\n\n**Physiotherapy:**\n• **Lisanne** — Physiotherapist, 6+ years, B.Sc. Netherlands\n• **Juni** — Physiotherapist + Lagree Instructor\n\n**Lagree instructors include:**\n• **Margot** — Level 1 certified, weekend mornings at both studios\n• **Celia** — Level 2 certified, dance background, alignment-focused\n\nVisit the **Team page** on our site for full profiles and photos.",
    chips: ['Physiotherapy', 'What is Lagree?', 'Studio locations'],
  },

  /* ── AFTERBURN ────────────────────────────────────────────── */
  {
    id: 'afterburn',
    phrases: ['afterburn effect', 'how long does the burn last', 'sore after class', 'still burning after', 'feel it the next day', '24 hour burn'],
    keywords: ['afterburn', 'burn', 'sore', 'soreness', 'metabolism', 'calories', '24 hours', 'after class', 'next day'],
    response: "One of Lagree's defining features is the **afterburn effect** — your metabolism stays elevated for up to **24 hours** after training.\n\nThis happens because Lagree keeps slow-twitch muscle fibers under sustained tension, demanding significant recovery energy. It's why the method is so effective for body composition and lean muscle development.",
    chips: ['What is Lagree?', 'Pricing', 'First-timer tips'],
  },

  /* ── SOUNDBATH ────────────────────────────────────────────── */
  {
    id: 'soundbath',
    phrases: ['sound bath', 'soundbath', 'lagree soundbath', 'lagree and soundbath', 'lagree + soundbath', 'meditation class'],
    keywords: ['sound', 'soundbath', 'bath', 'meditation', 'relax'],
    response: "Yes! We offer a **Lagree + Soundbath** experience for **€45** — combining a Lagree session with a guided sound bath meditation.\n\nBook via Bsport or ClassPass.",
    chips: ['Pricing', 'How to book', 'What is Lagree?'],
  },

  /* ── CONTACT ──────────────────────────────────────────────── */
  {
    id: 'contact',
    phrases: ['contact you', 'get in touch', 'how to reach', 'email address', 'speak to someone', 'talk to someone', 'reach the studio'],
    keywords: ['contact', 'email', 'phone', 'reach', 'speak', 'talk', 'message', 'hello'],
    response: "You can reach us at:\n\n📧 **hello@frameworkberlin.com**\n\nOr visit us in person:\n• **Prenzlauer Berg** — Christinenstraße 19a, 10119 Berlin\n• **Kreuzberg** — Oranienstraße 185, 10999 Berlin\n\nFor class bookings, use Bsport or ClassPass.",
    chips: ['Studio locations', 'How to book', 'Studio hours'],
  },

  /* ── THANKS ───────────────────────────────────────────────── */
  {
    id: 'thanks',
    phrases: ['thank you', 'thanks a lot', 'thanks so much', 'that was helpful', 'appreciate it', 'cheers for that'],
    keywords: ['thanks', 'thank', 'cheers', 'appreciate', 'helpful', 'perfect', 'awesome', 'great', 'wonderful'],
    response: "Glad I could help! Feel free to ask anything else — or come find us on the Megaformer. See you at Framework! 💪",
    chips: ['What is Lagree?', 'Pricing', 'How to book'],
  },
];

export const FALLBACK = {
  response: "I don't have specific details on that. For the most accurate info:\n\n📧 **hello@frameworkberlin.com**\n\nOr check Bsport / ClassPass for class schedules and live availability.",
  chips: ['Studio locations', 'Pricing', 'How to book', 'What is Lagree?'],
};
