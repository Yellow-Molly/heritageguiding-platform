# Phase 01 — Add FAQ Q&A Translation Keys to Locale JSON Files

## Context Links
- Plan: `./plan.md`
- en.json: `apps/web/messages/en.json` (lines 136–151 = existing `faq` namespace)
- sv.json: `apps/web/messages/sv.json` (lines 136–151 = existing `faq` namespace)
- de.json: `apps/web/messages/de.json` (lines 136–151 = existing `faq` namespace)

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Add 22 Q&A pairs under `faq.questions.{category}.q{N}.question` and `faq.questions.{category}.q{N}.answer` in all three locale files. No arrays — numbered keys only. Pure plain text, no HTML/Markdown.

## Key Insights
- Existing `faq` namespace has: `title`, `description`, `subtitle`, `categories.*`, `stillHaveQuestions`, `contactDescription`, `contactUs`
- Categories object currently has `safety` key — do NOT remove it here (Phase 03 handles that); just add `accessibility` alongside it so both exist during transition, or add it here and remove `safety` here too. Simpler: do the category rename in the same edit (combine with Phase 03).
- Translation structure mirrors `about.story.paragraph1` pattern — nested object, numbered keys.
- 6 categories: `booking` (5 Qs), `payment` (3 Qs), `cancellation` (3 Qs), `experience` (5 Qs), `guides` (3 Qs), `accessibility` (3 Qs) = 22 total.

## Requirements
- Functional: All 22 Q&A readable via `t('questions.booking.q1.question')` etc.
- Non-functional: Plain text only (no `<br>`, no `**bold**`). Keys camelCase. Files remain valid JSON.
- All three locale files must be updated atomically (no partial state).

## Architecture
Each locale file gets a `questions` object inside the `faq` namespace:
```json
"faq": {
  ...existing keys...,
  "questions": {
    "booking": {
      "q1": { "question": "...", "answer": "..." },
      "q2": { "question": "...", "answer": "..." },
      ...
    },
    "payment": { ... },
    "cancellation": { ... },
    "experience": { ... },
    "guides": { ... },
    "accessibility": { ... }
  }
}
```

## Related Code Files
- **Modify:** `apps/web/messages/en.json`
- **Modify:** `apps/web/messages/sv.json`
- **Modify:** `apps/web/messages/de.json`

## Implementation Steps

### Step 1 — Add `faq.questions` to `en.json`

Insert the following JSON block as the value of a new `"questions"` key inside the `"faq"` object, just before the closing `}` of the `faq` namespace. Also update `"categories"` to replace `"safety"` with `"accessibility"` (see Phase 03 note — doing it here is cleaner).

**Full English `faq.questions` content:**

```json
"questions": {
  "booking": {
    "q1": {
      "question": "How do I book a tour?",
      "answer": "Booking a tour is simple and fully online. You select your preferred experience, date, language, and group size through our booking platform. Once your booking is confirmed, you will receive a detailed confirmation email with meeting details, contact information, and practical guidance. If you have specific interests or requests, these can be shared during the booking process so your guide can tailor the experience accordingly."
    },
    "q2": {
      "question": "How far in advance should I book?",
      "answer": "We recommend booking as early as possible, especially during peak travel seasons such as spring, summer, and major holidays. Many of our guides are in high demand due to their expertise and limited availability. While last-minute bookings are sometimes possible, advance booking ensures access to your preferred guide, language, and time slot."
    },
    "q3": {
      "question": "Can I book for a group?",
      "answer": "Yes. All our tours are private and designed for individuals, couples, families, or larger groups. Group size can be selected during booking, and the experience will be adjusted to suit your group's interests and pace. For larger groups or corporate bookings, we recommend contacting us directly so we can ensure the best possible setup."
    },
    "q4": {
      "question": "Do I need to print my ticket?",
      "answer": "No. Printed tickets are not required. Your booking confirmation is sent digitally and can be shown on your phone or tablet. Your guide will already have your booking details and will meet you at the agreed location."
    },
    "q5": {
      "question": "What if I'm traveling alone?",
      "answer": "Solo travelers are very welcome. Many guests choose Private Tours specifically for the personal attention and flexibility that a private experience provides. The content, pacing, and focus of the tour will be fully adapted to your interests."
    }
  },
  "payment": {
    "q1": {
      "question": "What payment methods do you accept?",
      "answer": "We accept major credit and debit cards, including Visa and Mastercard. All payments are processed securely through our booking platform using encrypted payment solutions. Full payment is required at the time of booking to confirm your reservation."
    },
    "q2": {
      "question": "What does the price include?",
      "answer": "The price includes a private, guided experience led by an authorized professional, all planning and preparation, and hosting throughout the tour. Where applicable, logistics and transportation coordination are included. Any additional costs such as meals, entrance fees, or third-party services will be clearly stated in advance."
    },
    "q3": {
      "question": "Are there any hidden fees?",
      "answer": "No. All prices are transparent and clearly stated during booking. If optional extras are available, these are always presented separately so you can make informed choices."
    }
  },
  "cancellation": {
    "q1": {
      "question": "What is your cancellation policy?",
      "answer": "Cancellations made more than 48 hours before the scheduled start time receive a full refund. Cancellations made 24-48 hours before the tour receive a partial refund. Cancellations within 24 hours of the tour start time are non-refundable, as guides and logistics are already fully committed."
    },
    "q2": {
      "question": "Can I reschedule my tour?",
      "answer": "Yes, subject to guide availability. We recommend contacting us as early as possible if you need to reschedule. While we cannot guarantee availability for new dates, we always do our best to accommodate changes."
    },
    "q3": {
      "question": "What happens if the tour is canceled by you?",
      "answer": "In the unlikely event that we need to cancel a tour, you will be offered a full refund or the option to reschedule at no additional cost."
    }
  },
  "experience": {
    "q1": {
      "question": "How long do tours last?",
      "answer": "Most tours last between 2 and 4 hours, depending on the experience you choose. Duration is clearly stated during booking, and private tours allow for flexibility if you wish to explore certain topics in more depth."
    },
    "q2": {
      "question": "What languages are tours offered in?",
      "answer": "Tours are offered in Swedish, English, and German. Each guide is professionally certified in the language they offer to ensure clarity, nuance, and a high-quality experience."
    },
    "q3": {
      "question": "Are tours suitable for children?",
      "answer": "Yes. Tours can be adapted for families with children. Please let us know the age range when booking so your guide can adjust content and pacing accordingly."
    },
    "q4": {
      "question": "Do tours run in all weather conditions?",
      "answer": "Yes. Tours operate year-round and in most weather conditions. We recommend dressing appropriately for the season. In case of extreme weather, we will contact you in advance to discuss alternatives."
    },
    "q5": {
      "question": "Is transportation included?",
      "answer": "Transportation details vary depending on the tour. When included, this will be clearly stated in the tour description. Your guide will always assist with logistics to ensure a smooth experience."
    }
  },
  "guides": {
    "q1": {
      "question": "Who are your guides?",
      "answer": "Our guides are authorized professionals and subject-matter experts, many with academic backgrounds in history, archaeology, or cultural studies. All guides are carefully vetted to ensure deep knowledge, strong communication skills, and professional hosting."
    },
    "q2": {
      "question": "Are your guides licensed?",
      "answer": "Yes. We work exclusively with licensed guides or verified experts. Credentials and language certifications are reviewed as part of our selection process."
    },
    "q3": {
      "question": "Will the same guide stay with us throughout the tour?",
      "answer": "Yes. Your guide is there to host you throughout the experience, creating continuity and a relaxed, personal atmosphere. In the rare cases where an experience involves multiple guides or distinct stages, this will always be clearly stated beforehand, ensuring full transparency and peace of mind."
    }
  },
  "accessibility": {
    "q1": {
      "question": "Are tours accessible for guests with mobility needs?",
      "answer": "We want everyone to feel comfortable and welcome on our tours. Accessibility details are clearly outlined in each tour description, so you can easily see walking distances, terrain, and physical requirements in advance. Many of our experiences can accommodate mobility needs, and we are always happy to help. If you have any specific wishes or questions, please do not hesitate to contact us and we will gladly guide you toward the most suitable option."
    },
    "q2": {
      "question": "What should I bring?",
      "answer": "Comfortable walking shoes and weather-appropriate clothing are recommended. Any additional requirements will be communicated in your booking confirmation."
    },
    "q3": {
      "question": "How do I contact you before or during the tour?",
      "answer": "You can reach us via email or phone using the contact details provided in your confirmation email. Your guide's contact information will also be included for day-of coordination."
    }
  }
}
```

Also update `"categories"` in `en.json` `faq` namespace:
- Remove: `"safety": "Safety & Health"`
- Add: `"accessibility": "Accessibility & Practical Information"`

---

### Step 2 — Add `faq.questions` to `sv.json`

**Full Swedish `faq.questions` content (professional translation):**

```json
"questions": {
  "booking": {
    "q1": {
      "question": "Hur bokar jag en tur?",
      "answer": "Att boka en tur är enkelt och sker helt online. Du väljer din önskade upplevelse, datum, språk och grupstorlek via vår bokningsplattform. När din bokning är bekräftad får du ett detaljerat bekräftelsemail med mötesinformation, kontaktuppgifter och praktisk vägledning. Om du har specifika intressen eller önskemål kan dessa anges under bokningsprocessen så att din guide kan anpassa upplevelsen därefter."
    },
    "q2": {
      "question": "Hur långt i förväg bör jag boka?",
      "answer": "Vi rekommenderar att boka så tidigt som möjligt, särskilt under högsäsong som vår, sommar och större helgdagar. Många av våra guider är mycket efterfrågade på grund av sin expertis och begränsade tillgänglighet. Även om senbokningar ibland är möjliga, säkerställer tidig bokning tillgång till din önskade guide, språk och tidsplats."
    },
    "q3": {
      "question": "Kan jag boka för en grupp?",
      "answer": "Ja. Alla våra turer är privata och utformade för individer, par, familjer eller större grupper. Gruppstorleken väljs vid bokningstillfället och upplevelsen anpassas efter din grupps intressen och tempo. För större grupper eller företagsbokningar rekommenderar vi att du kontaktar oss direkt så att vi kan säkerställa bästa möjliga upplägg."
    },
    "q4": {
      "question": "Behöver jag skriva ut min biljett?",
      "answer": "Nej. Utskrivna biljetter krävs inte. Din bokningsbekräftelse skickas digitalt och kan visas på din telefon eller surfplatta. Din guide har redan dina bokningsuppgifter och möter dig på den överenskomna platsen."
    },
    "q5": {
      "question": "Vad gäller om jag reser ensam?",
      "answer": "Ensamresande är mycket välkomna. Många gäster väljer Private Tours just för den personliga uppmärksamheten och flexibiliteten som en privat upplevelse erbjuder. Tuerns innehåll, tempo och fokus anpassas helt efter dina intressen."
    }
  },
  "payment": {
    "q1": {
      "question": "Vilka betalningsmetoder accepterar ni?",
      "answer": "Vi accepterar de vanligaste kredit- och betalkorten, inklusive Visa och Mastercard. Alla betalningar behandlas säkert via vår bokningsplattform med krypterade betalningslösningar. Full betalning krävs vid bokningstillfället för att bekräfta din reservation."
    },
    "q2": {
      "question": "Vad ingår i priset?",
      "answer": "Priset inkluderar en privat, guidad upplevelse ledd av en auktoriserad professionell, all planering och förberedelse samt värdskap under hela turen. Där det är tillämpligt ingår även logistik- och transportkoordinering. Eventuella tillkommande kostnader såsom måltider, entreavgifter eller tjänster från tredje part anges alltid tydligt i förväg."
    },
    "q3": {
      "question": "Finns det några dolda avgifter?",
      "answer": "Nej. Alla priser är transparenta och anges tydligt vid bokningstillfället. Om valfria tillägg finns tillgängliga presenteras dessa alltid separat så att du kan fatta välgrundade beslut."
    }
  },
  "cancellation": {
    "q1": {
      "question": "Vad är er avbokningspolicy?",
      "answer": "Avbokningar som görs mer än 48 timmar före planerad starttid erhåller full återbetalning. Avbokningar som görs 24-48 timmar före turen erhåller delvis återbetalning. Avbokningar inom 24 timmar före turstarten återbetalas inte, eftersom guider och logistik redan är fullt inbokade."
    },
    "q2": {
      "question": "Kan jag boka om min tur?",
      "answer": "Ja, beroende på guidens tillgänglighet. Vi rekommenderar att du kontaktar oss så tidigt som möjligt om du behöver boka om. Även om vi inte kan garantera tillgänglighet för nya datum gör vi alltid vårt bästa för att tillmötesgå ändringar."
    },
    "q3": {
      "question": "Vad händer om ni ställer in turen?",
      "answer": "I det osannolika fallet att vi behöver ställa in en tur erbjuds du full återbetalning eller möjligheten att boka om utan extra kostnad."
    }
  },
  "experience": {
    "q1": {
      "question": "Hur länge varar turerna?",
      "answer": "De flesta turer varar mellan 2 och 4 timmar, beroende på vilken upplevelse du väljer. Varaktigheten anges tydligt vid bokningstillfället, och privata turer ger flexibilitet om du vill utforska vissa ämnen mer på djupet."
    },
    "q2": {
      "question": "På vilka språk erbjuds turerna?",
      "answer": "Turer erbjuds på svenska, engelska och tyska. Varje guide är professionellt certifierad på det språk de erbjuder för att säkerställa klarhet, nyansrikedom och en högkvalitativ upplevelse."
    },
    "q3": {
      "question": "Passar turerna för barn?",
      "answer": "Ja. Turer kan anpassas för familjer med barn. Ange gärna åldersintervallet vid bokningstillfället så att din guide kan justera innehåll och tempo accordingly."
    },
    "q4": {
      "question": "Genomförs turerna i alla väderförhållanden?",
      "answer": "Ja. Turer genomförs året runt och i de flesta väderförhållanden. Vi rekommenderar att klä sig lämpligt efter säsongen. Vid extrema väderförhållanden kontaktar vi dig i förväg för att diskutera alternativ."
    },
    "q5": {
      "question": "Ingår transport?",
      "answer": "Transportdetaljer varierar beroende på turen. När transport ingår anges detta tydligt i turtbeskrivningen. Din guide hjälper alltid till med logistiken för att säkerställa en smidig upplevelse."
    }
  },
  "guides": {
    "q1": {
      "question": "Vilka är era guider?",
      "answer": "Våra guider är auktoriserade yrkespersoner och ämnesexperter, många med akademisk bakgrund inom historia, arkeologi eller kulturvetenskap. Alla guider är noggrant utvalda för att säkerställa djup kunskap, starka kommunikationsfärdigheter och professionellt värdskap."
    },
    "q2": {
      "question": "Är era guider licensierade?",
      "answer": "Ja. Vi samarbetar uteslutande med licensierade guider eller verifierade experter. Meriter och språkcertifieringar granskas som en del av vår urvalsprocess."
    },
    "q3": {
      "question": "Följer samma guide med oss under hela turen?",
      "answer": "Ja. Din guide finns där för att vara värd under hela upplevelsen, vilket skapar kontinuitet och en avslappnad, personlig atmosfär. I de sällsynta fall där en upplevelse involverar flera guider eller tydliga etapper anges detta alltid tydligt i förväg, vilket säkerställer full transparens och trygghet."
    }
  },
  "accessibility": {
    "q1": {
      "question": "Är turerna tillgängliga för gäster med rörelsebehov?",
      "answer": "Vi vill att alla ska känna sig bekväma och välkomna på våra turer. Tillgänglighetsdetaljer beskrivs tydligt i varje turbeskrivning, så att du enkelt kan se gångavstånd, terräng och fysiska krav i förväg. Många av våra upplevelser kan anpassas för rörelsebehov och vi hjälper alltid gärna till. Om du har specifika önskemål eller frågor är du välkommen att kontakta oss, så vägleder vi dig mot det mest lämpliga alternativet."
    },
    "q2": {
      "question": "Vad bör jag ta med mig?",
      "answer": "Bekväma promenadskor och väderlämpliga kläder rekommenderas. Eventuella ytterligare krav kommuniceras i din bokningsbekräftelse."
    },
    "q3": {
      "question": "Hur kontaktar jag er före eller under turen?",
      "answer": "Du kan nå oss via e-post eller telefon med hjälp av kontaktuppgifterna i din bekräftelse. Din guides kontaktinformation inkluderas också för koordinering på turdagen."
    }
  }
}
```

Also update `"categories"` in `sv.json` `faq` namespace:
- Remove: `"safety": "Säkerhet & Hälsa"`
- Add: `"accessibility": "Tillgänglighet & Praktisk Information"`

---

### Step 3 — Add `faq.questions` to `de.json`

**Full German `faq.questions` content (professional translation):**

```json
"questions": {
  "booking": {
    "q1": {
      "question": "Wie buche ich eine Tour?",
      "answer": "Eine Tour zu buchen ist einfach und vollständig online möglich. Sie wählen Ihr bevorzugtes Erlebnis, Datum, Sprache und Gruppengröße über unsere Buchungsplattform. Sobald Ihre Buchung bestätigt ist, erhalten Sie eine detaillierte Bestätigungs-E-Mail mit Treffpunktdetails, Kontaktdaten und praktischen Hinweisen. Wenn Sie spezifische Interessen oder Wünsche haben, können diese während des Buchungsprozesses angegeben werden, damit Ihr Guide das Erlebnis entsprechend gestalten kann."
    },
    "q2": {
      "question": "Wie weit im Voraus sollte ich buchen?",
      "answer": "Wir empfehlen, so früh wie möglich zu buchen, insbesondere während der Hauptreisezeiten wie Frühling, Sommer und großen Feiertagen. Viele unserer Guides sind aufgrund ihrer Expertise und begrenzten Verfügbarkeit sehr gefragt. Obwohl Last-Minute-Buchungen manchmal möglich sind, sichert eine frühzeitige Buchung den Zugang zu Ihrem bevorzugten Guide, Ihrer Sprache und Ihrem Zeitfenster."
    },
    "q3": {
      "question": "Kann ich für eine Gruppe buchen?",
      "answer": "Ja. Alle unsere Touren sind privat und für Einzelpersonen, Paare, Familien oder größere Gruppen konzipiert. Die Gruppengröße kann bei der Buchung ausgewählt werden, und das Erlebnis wird auf die Interessen und das Tempo Ihrer Gruppe abgestimmt. Für größere Gruppen oder Firmenbuchungen empfehlen wir, uns direkt zu kontaktieren, damit wir die bestmögliche Vorbereitung sicherstellen können."
    },
    "q4": {
      "question": "Muss ich mein Ticket ausdrucken?",
      "answer": "Nein. Ausgedruckte Tickets sind nicht erforderlich. Ihre Buchungsbestätigung wird digital versendet und kann auf Ihrem Telefon oder Tablet vorgezeigt werden. Ihr Guide hat Ihre Buchungsdetails bereits vorliegen und wird Sie am vereinbarten Ort treffen."
    },
    "q5": {
      "question": "Was gilt, wenn ich alleine reise?",
      "answer": "Alleinreisende sind herzlich willkommen. Viele Gäste entscheiden sich für Private Tours speziell wegen der persönlichen Aufmerksamkeit und Flexibilität, die ein privates Erlebnis bietet. Inhalt, Tempo und Schwerpunkt der Tour werden vollständig Ihren Interessen angepasst."
    }
  },
  "payment": {
    "q1": {
      "question": "Welche Zahlungsmethoden akzeptieren Sie?",
      "answer": "Wir akzeptieren gängige Kredit- und Debitkarten, einschließlich Visa und Mastercard. Alle Zahlungen werden sicher über unsere Buchungsplattform mit verschlüsselten Zahlungslösungen verarbeitet. Zur Bestätigung Ihrer Reservierung ist eine vollständige Zahlung zum Zeitpunkt der Buchung erforderlich."
    },
    "q2": {
      "question": "Was ist im Preis inbegriffen?",
      "answer": "Der Preis beinhaltet ein privates, geführtes Erlebnis unter der Leitung eines autorisierten Fachmanns, alle Planung und Vorbereitung sowie die Betreuung während der gesamten Tour. Wo zutreffend, sind Logistik und Transportkoordination eingeschlossen. Etwaige zusätzliche Kosten wie Mahlzeiten, Eintrittsgebühren oder Drittanbieter-Dienstleistungen werden stets im Voraus klar angegeben."
    },
    "q3": {
      "question": "Gibt es versteckte Gebühren?",
      "answer": "Nein. Alle Preise sind transparent und werden bei der Buchung klar angegeben. Falls optionale Zusatzleistungen verfügbar sind, werden diese stets separat aufgeführt, damit Sie fundierte Entscheidungen treffen können."
    }
  },
  "cancellation": {
    "q1": {
      "question": "Was ist Ihre Stornierungsrichtlinie?",
      "answer": "Stornierungen, die mehr als 48 Stunden vor dem geplanten Starttermin vorgenommen werden, erhalten eine vollständige Rückerstattung. Stornierungen 24-48 Stunden vor der Tour erhalten eine teilweise Rückerstattung. Stornierungen innerhalb von 24 Stunden vor Tourbeginn sind nicht erstattungsfähig, da Guides und Logistik bereits vollständig eingeplant sind."
    },
    "q2": {
      "question": "Kann ich meine Tour umbuchen?",
      "answer": "Ja, vorbehaltlich der Verfügbarkeit des Guides. Wir empfehlen, uns so früh wie möglich zu kontaktieren, wenn Sie umbuchen möchten. Obwohl wir die Verfügbarkeit für neue Termine nicht garantieren können, bemühen wir uns stets, Änderungen zu ermöglichen."
    },
    "q3": {
      "question": "Was passiert, wenn Sie die Tour absagen?",
      "answer": "Im unwahrscheinlichen Fall, dass wir eine Tour absagen müssen, erhalten Sie eine vollständige Rückerstattung oder die Möglichkeit, ohne zusätzliche Kosten umzubuchen."
    }
  },
  "experience": {
    "q1": {
      "question": "Wie lange dauern die Touren?",
      "answer": "Die meisten Touren dauern zwischen 2 und 4 Stunden, je nach gewähltem Erlebnis. Die Dauer wird bei der Buchung klar angegeben, und private Touren bieten Flexibilität, wenn Sie bestimmte Themen ausführlicher erkunden möchten."
    },
    "q2": {
      "question": "In welchen Sprachen werden Touren angeboten?",
      "answer": "Touren werden auf Schwedisch, Englisch und Deutsch angeboten. Jeder Guide ist in der von ihm angebotenen Sprache professionell zertifiziert, um Klarheit, Nuancen und ein hochwertiges Erlebnis zu gewährleisten."
    },
    "q3": {
      "question": "Sind Touren für Kinder geeignet?",
      "answer": "Ja. Touren können für Familien mit Kindern angepasst werden. Bitte teilen Sie uns bei der Buchung die Altersgruppe mit, damit Ihr Guide Inhalt und Tempo entsprechend anpassen kann."
    },
    "q4": {
      "question": "Finden Touren bei jedem Wetter statt?",
      "answer": "Ja. Touren finden das ganze Jahr über und bei den meisten Witterungsbedingungen statt. Wir empfehlen, sich der Jahreszeit entsprechend zu kleiden. Bei extremen Wetterverhältnissen werden wir Sie im Voraus kontaktieren, um Alternativen zu besprechen."
    },
    "q5": {
      "question": "Ist Transport inbegriffen?",
      "answer": "Transportdetails variieren je nach Tour. Wenn Transport enthalten ist, wird dies in der Tourbeschreibung klar angegeben. Ihr Guide wird stets bei der Logistik behilflich sein, um ein reibungsloses Erlebnis zu gewährleisten."
    }
  },
  "guides": {
    "q1": {
      "question": "Wer sind Ihre Guides?",
      "answer": "Unsere Guides sind autorisierte Fachleute und Sachverständige, viele mit akademischem Hintergrund in Geschichte, Archäologie oder Kulturwissenschaften. Alle Guides werden sorgfältig geprüft, um fundiertes Wissen, starke Kommunikationsfähigkeiten und professionelle Betreuung sicherzustellen."
    },
    "q2": {
      "question": "Sind Ihre Guides lizenziert?",
      "answer": "Ja. Wir arbeiten ausschließlich mit lizenzierten Guides oder verifizierten Experten zusammen. Qualifikationen und Sprachzertifizierungen werden im Rahmen unseres Auswahlprozesses überprüft."
    },
    "q3": {
      "question": "Bleibt derselbe Guide während der gesamten Tour bei uns?",
      "answer": "Ja. Ihr Guide ist während des gesamten Erlebnisses Ihr Gastgeber und sorgt für Kontinuität sowie eine entspannte, persönliche Atmosphäre. In den seltenen Fällen, in denen ein Erlebnis mehrere Guides oder distinct Abschnitte umfasst, wird dies stets im Voraus klar angegeben, um vollständige Transparenz und Sicherheit zu gewährleisten."
    }
  },
  "accessibility": {
    "q1": {
      "question": "Sind Touren für Gäste mit eingeschränkter Mobilität zugänglich?",
      "answer": "Wir möchten, dass sich alle Gäste auf unseren Touren wohlfühlen und willkommen sind. Zugänglichkeitsdetails sind in jeder Tourbeschreibung klar aufgeführt, sodass Sie Gehstrecken, Gelände und körperliche Anforderungen im Voraus einsehen können. Viele unserer Erlebnisse können Mobilitätsbedürfnisse berücksichtigen, und wir helfen stets gerne weiter. Wenn Sie spezifische Wünsche oder Fragen haben, zögern Sie bitte nicht, uns zu kontaktieren - wir werden Sie gerne zu der am besten geeigneten Option führen."
    },
    "q2": {
      "question": "Was sollte ich mitbringen?",
      "answer": "Bequeme Wanderschuhe und witterungsgerechte Kleidung werden empfohlen. Etwaige zusätzliche Anforderungen werden in Ihrer Buchungsbestätigung mitgeteilt."
    },
    "q3": {
      "question": "Wie kann ich Sie vor oder während der Tour erreichen?",
      "answer": "Sie können uns per E-Mail oder Telefon unter den in Ihrer Bestätigungs-E-Mail angegebenen Kontaktdaten erreichen. Die Kontaktdaten Ihres Guides werden ebenfalls für die Koordination am Tourtag angegeben."
    }
  }
}
```

Also update `"categories"` in `de.json` `faq` namespace:
- Remove: `"safety": "Sicherheit & Gesundheit"`
- Add: `"accessibility": "Barrierefreiheit & Praktische Informationen"`

---

## Todo List

- [ ] Edit `en.json`: add `faq.questions` block, replace `faq.categories.safety` with `faq.categories.accessibility`
- [ ] Edit `sv.json`: add `faq.questions` block, replace `faq.categories.safety` with `faq.categories.accessibility`
- [ ] Edit `de.json`: add `faq.questions` block, replace `faq.categories.safety` with `faq.categories.accessibility`
- [ ] Validate all three files are valid JSON (use `node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json','utf8'))"` etc.)

## Success Criteria
- All 3 locale JSON files are valid JSON
- `t('faq.questions.booking.q1.question')` resolves correctly in each locale
- `t('faq.categories.accessibility')` resolves; `t('faq.categories.safety')` key no longer present
- 22 questions × 3 locales = 66 Q&A pairs total across files

## Risk Assessment
- **Risk:** JSON syntax error (missing comma, trailing comma) → **Mitigation:** Validate JSON after edit
- **Risk:** Apostrophe in English text (e.g. "I'm") mishandled → **Mitigation:** JSON strings use `"` not `'`; apostrophes fine inside
- **Risk:** Swedish/German special chars (å, ä, ö, ü, etc.) → **Mitigation:** JSON files are UTF-8, no escaping needed

## Security Considerations
- Translation values are plain text rendered via React — no XSS risk
- No user input involved

## Next Steps
- Phase 02: Update `page.tsx` to read Q&A from translations
- Phase 03: Verify category labels (handled here in same edit)
