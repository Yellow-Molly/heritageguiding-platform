"""Replace the `faq` block in en.json/sv.json/de.json with the new 7-section structure.

Idempotent: re-running just rewrites the same content.
Run from repo root: python plans/260506-2220-faq-content-update/update-faq-content.py
"""
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MESSAGES_DIR = REPO_ROOT / "apps" / "web" / "messages"

# ============================================================================
# EN — polished from docx/Private_Tours_FAQ_EN.docx (Version 5.0)
# Cancellation Q&As are generic (no specific tier numbers); geography broadened
# from Stockholm to Sweden where appropriate.
# ============================================================================
EN_FAQ = {
    "title": "Frequently Asked Questions",
    "description": "Find answers about private tours in Sweden — booking, guides, cancellation, and what to expect.",
    "subtitle": "Everything you need to know about our private tours across Sweden",
    "categories": {
        "understanding": "Understanding Private Tours",
        "comparing": "Comparing & Choosing",
        "booking": "Booking",
        "afterBooking": "After Booking",
        "cancellation": "Cancellation, Refunds & Changes",
        "experience": "The Tour Experience",
        "about": "About Private Tours",
    },
    "stillHaveQuestions": "Still have questions?",
    "contactDescription": "Our team is ready to help you plan your perfect private tour experience.",
    "contactUs": "Contact Us",
    "questions": {
        "understanding": {
            "q1": {
                "question": "What is a private guided tour?",
                "answer": "A private guided tour is an experience where you and your group are alone with an authorized guide — no other participants. The tour follows a carefully planned schedule with full flexibility to adapt the pace and focus to your group. Private Tours offers exclusively private tours, never open group tours.",
            },
            "q2": {
                "question": "How does a private tour work — step by step?",
                "answer": "A private tour with Private Tours works in four steps: (1) you select your experience, date, language, and group size via our booking platform, (2) you receive a booking confirmation and one of our guides will contact you before the tour, (3) the guide meets you according to the tour instructions or at an agreed location, (4) after the tour, we welcome your feedback to maintain our quality standards.",
            },
            "q3": {
                "question": "What is the difference between a private tour and a group tour?",
                "answer": "A private tour means you and your group are alone with the guide — no other group is included. The tour follows a schedule but is adapted to your group's pace and interests. A group tour is shared with unknown participants and offers limited ability to influence the itinerary.",
            },
            "q4": {
                "question": "What does an authorized guide mean?",
                "answer": "An authorized guide is a professionally certified guide with approved training, examined language skills, and verified professional competence. Private Tours works exclusively with authorized guides and verified experts — never with untrained guides or volunteers.",
            },
            "q5": {
                "question": "How do I know the tour will be of high quality?",
                "answer": "Quality at Private Tours starts with selection — every guide is authorized, personally reviewed, and approved by us. We collect feedback after every tour and act immediately if anything falls below our standard.",
            },
        },
        "comparing": {
            "q1": {
                "question": "Which private tour is best for me?",
                "answer": "The right private tour depends on what you want to experience (history, food, architecture, nature), how much time you have (2–8 hours or multi-day itineraries), and your group's composition. Contact us if you are unsure — we will help you match your wishes with the right guide and the right tour.",
            },
            "q2": {
                "question": "Why should I choose Private Tours instead of GetYourGuide, TripAdvisor, or free tours?",
                "answer": "GetYourGuide and TripAdvisor are open platforms with a wide range of tours from many different providers — quality and format vary depending on who you book with. Private Tours is a curated platform where every guide is authorized and personally reviewed, every experience is fully private with no unknown participants, and we take full responsibility for quality and logistics from start to finish.",
            },
            "q3": {
                "question": "Can you create custom tours or multi-day itineraries?",
                "answer": "Yes. Thanks to our extensive national network of authorized guides and experiences, we can create tailored tours that few others can offer — from thematic deep-dives to multi-day itineraries and VIP packages. For this type of request, please fill in our contact form and we will come back to you with a tailored proposal.",
            },
            "q4": {
                "question": "Do you offer food and culinary experiences?",
                "answer": "Yes. Several of our private tours combine historical guiding with Swedish culinary traditions and food experiences. Specific activities and food themes are detailed in each tour description. Customized culinary experiences can also be arranged separately.",
            },
            "q5": {
                "question": "Do you accommodate corporate clients and B2B groups?",
                "answer": "Yes. Private Tours offers private tours for companies, team building, conference participants, and VIP guests. We put together tailored packages based on group size, purpose, and budget. Fill in our contact form and we will come back to you with a tailored proposal.",
            },
        },
        "booking": {
            "q1": {
                "question": "What do I need to consider when booking?",
                "answer": "When booking, you select your experience, date, language, and group size. If you have specific requests beyond that, you are welcome to contact us directly. Last-minute bookings are sometimes possible — contact us in that case.",
            },
            "q2": {
                "question": "How far in advance should I book?",
                "answer": "We recommend booking as early as possible — ideally several months in advance during peak season (May–September) and around major holidays. Some of our tours are very popular and fill up quickly. Booking early secures the right guide, the right language, and the right date.",
            },
            "q3": {
                "question": "Can I see the guide's profile before I book?",
                "answer": "It depends on the tour. For some tours, the guide's profile is shown directly — for others, a guide is assigned after booking, and you will then have access to their profile. Regardless of which guide you receive, you can be confident they are authorized and specifically verified for that particular tour.",
            },
            "q4": {
                "question": "Can I book as a solo traveler, couple, or family?",
                "answer": "Yes. Private tours with Private Tours suit solo travelers, couples, families, and groups — the experience is always adapted to you. Information about what applies for children is clearly stated in each tour description.",
            },
            "q5": {
                "question": "What payment methods do you accept?",
                "answer": "We accept Visa and Mastercard with the highest security standards for online payments. Full payment is required at the time of booking. All prices are transparent and displayed in the applicable currency — no hidden fees.",
            },
            "q6": {
                "question": "What is included in the price?",
                "answer": "The price includes the private guided experience, all planning and preparation, and the guide's presence throughout the tour. All fees and any additional costs are clearly stated in each tour description.",
            },
        },
        "afterBooking": {
            "q1": {
                "question": "What happens after I have booked a private tour?",
                "answer": "Immediately after booking, you receive a confirmation by email with meeting point, time, and practical information about the tour. A guide is then assigned to your booking and will contact you with their details before the tour. You do not need to print anything — the confirmation can be shown on your phone.",
            },
            "q2": {
                "question": "Where does a private tour start?",
                "answer": "The starting point and practical information are stated in each tour description. For pickups or meetings at alternative locations, your assigned guide will contact you after your booking confirmation with all the details.",
            },
            "q3": {
                "question": "Can the tour start at my hotel or another location I choose?",
                "answer": "It depends on the tour — whether pickup or a custom starting point is possible is clearly stated in each tour description. Please note that a customized starting point may affect the tour itinerary.",
            },
            "q4": {
                "question": "Do I need to print a ticket?",
                "answer": "No. No printed ticket is required — your digital booking confirmation on your phone is sufficient. Our guides wear branded clothing so you can easily recognize them at the meeting point.",
            },
        },
        "cancellation": {
            "q1": {
                "question": "What is the cancellation policy for private tours?",
                "answer": "Each tour has its own cancellation terms displayed at booking and on the tour page. The exact refund and rescheduling rules depend on how close to the tour date you cancel, and on the specific tour. We always show these rules transparently before you confirm your booking. In cases of force majeure or guide cancellation, we will always contact you proactively.",
            },
            "q2": {
                "question": "How do I cancel and how long does a refund take?",
                "answer": "Cancellations are made by email to us with your booking reference — the refund is initiated immediately according to the cancellation terms shown at booking. Refunds typically appear in your account within 2–5 banking days, depending on your bank and payment method.",
            },
            "q3": {
                "question": "Can I reschedule my tour instead of canceling?",
                "answer": "Yes. We always do our utmost to find a workable solution — contact us as early as possible. Specific rescheduling terms vary by tour and follow that tour's cancellation policy.",
            },
            "q4": {
                "question": "What happens if I miss the tour without canceling?",
                "answer": "If you fail to show up without canceling (no-show), no refund will be issued as the guide is fully committed and waiting. Contact the guide directly if you are running late — we always do our best to find a solution if you reach out in time.",
            },
            "q5": {
                "question": "What happens in case of extreme weather or force majeure?",
                "answer": "In the event of extreme weather or force majeure, Private Tours always offers a free rescheduling option or a full refund. We will contact you proactively in such situations — you never need to worry about losing money due to events outside your control.",
            },
            "q6": {
                "question": "What happens if the guide has to cancel?",
                "answer": "If our guide cancels, we will contact you immediately and offer either an equivalent authorized alternative guide or a full refund — at no extra cost. We always resolve this before your tour day.",
            },
        },
        "experience": {
            "q1": {
                "question": "How long does a private tour last?",
                "answer": "Most private tours with Private Tours last 2–8 hours depending on the experience. The duration is clearly stated in each tour description.",
            },
            "q2": {
                "question": "What languages are private tours offered in?",
                "answer": "Private Tours offers private tours in most major world languages. Available languages for each specific tour are clearly stated in the tour description.",
            },
            "q3": {
                "question": "Are private tours suitable for children and families?",
                "answer": "Yes. Private tours can be adapted for families with children of all ages. Information about what applies for children is clearly stated in each tour description.",
            },
            "q4": {
                "question": "Do tours run in all weather conditions?",
                "answer": "Yes. Private tours operate year-round and in most weather conditions — please dress appropriately for the season. In the event of extreme weather that makes the tour impossible, we will contact you in advance and offer a free rescheduling option.",
            },
            "q5": {
                "question": "Are tours accessible for guests with mobility needs?",
                "answer": "Accessibility information — walking distances, terrain, and physical requirements — is clearly stated in each tour description. Since all tours are private, you always have full flexibility to adapt the experience to your needs. You are also welcome to contact us if you have any questions.",
            },
        },
        "about": {
            "q1": {
                "question": "What is Private Tours?",
                "answer": "Private Tours is a curated platform for private guided tours in Sweden. We connect travelers with authorized guides and verified experts for experiences that are personal, reliable, and thoughtfully designed from start to finish. Every guide is handpicked — we take full responsibility for the quality of every tour we offer.",
            },
            "q2": {
                "question": "How does Private Tours work with responsible tourism?",
                "answer": "Private Tours works exclusively with local, authorized guides and experts and actively supports local initiatives and events. All our tours are private — never mass groups. We respect the environments and communities we visit and treat cultural heritage as a responsibility, not a backdrop.",
            },
        },
    },
}

# ============================================================================
# SV — sourced from docx/Private_Tours_FAQ_SV.docx (Version 5.0)
# "i Stockholm" dropped from generic questions; cancellation Q&As generic.
# ============================================================================
SV_FAQ = {
    "title": "Vanliga Frågor",
    "description": "Hitta svar om privata turer i Sverige — bokning, guider, avbokning och vad du kan förvänta dig.",
    "subtitle": "Allt du behöver veta om våra privata turer i hela Sverige",
    "categories": {
        "understanding": "Förstå Private Tours",
        "comparing": "Jämföra & välja",
        "booking": "Boka",
        "afterBooking": "Efter bokning",
        "cancellation": "Avbokning, återbetalning & ändringar",
        "experience": "Turupplevelsen",
        "about": "Om Private Tours",
    },
    "stillHaveQuestions": "Har du fler frågor?",
    "contactDescription": "Vårt team hjälper dig gärna att planera din perfekta privata tur.",
    "contactUs": "Kontakta Oss",
    "questions": {
        "understanding": {
            "q1": {
                "question": "Vad är en privat guidad tur?",
                "answer": "En privat guidad tur är en upplevelse där du och ditt sällskap är ensamma med en auktoriserad guide — utan andra deltagare. Turen följer ett genomtänkt schema men med full flexibilitet att anpassa tempo och fokus efter er grupp. Private Tours erbjuder enbart privata turer, aldrig öppna gruppresor.",
            },
            "q2": {
                "question": "Hur fungerar en privat tur — steg för steg?",
                "answer": "En privat tur hos Private Tours fungerar i fyra steg: (1) du väljer upplevelse, datum, språk och gruppstorlek via vår bokningsplattform, (2) du får en bokningsbekräftelse och en av våra guider kontaktar dig inför turen, (3) guiden möter dig enligt turens instruktioner eller på avtalad plats, (4) efter turen välkomnar vi din återkoppling för att hålla kvaliteten hög.",
            },
            "q3": {
                "question": "Vad är skillnaden mellan en privat tur och en gruppresa?",
                "answer": "En privat tur innebär att du och ditt sällskap är ensamma med guiden — ingen annan grupp ingår. Turen följer ett schema men anpassas efter er grupps tempo och intressen. En gruppresa delar du med okända deltagare och har begränsad möjlighet att påverka upplägget.",
            },
            "q4": {
                "question": "Vad innebär en auktoriserad guide?",
                "answer": "En auktoriserad guide är en professionellt certifierad guide med godkänd utbildning, examinerade språkkunskaper och verifierad yrkeskompetens. Private Tours arbetar uteslutande med auktoriserade guider och verifierade experter — aldrig med outbildade guider eller frivilliga.",
            },
            "q5": {
                "question": "Hur vet jag att turen håller hög kvalitet?",
                "answer": "Kvalitet hos Private Tours börjar med urvalet — varje guide är auktoriserad, personligen granskad och godkänd av oss. Vi samlar in feedback efter varje tur och agerar direkt om något inte lever upp till vår standard.",
            },
        },
        "comparing": {
            "q1": {
                "question": "Vilken privat tur passar mig bäst?",
                "answer": "Rätt privat tur beror på vad du vill uppleva (historia, mat, arkitektur, natur), hur lång tid du har (2–8 timmar eller flerdagarsupplägg) och din grupps sammansättning. Kontakta oss om du är osäker — vi hjälper dig matcha önskemål med rätt guide och rätt upplägg.",
            },
            "q2": {
                "question": "Varför ska jag välja Private Tours istället för GetYourGuide, TripAdvisor eller gratis-turer?",
                "answer": "GetYourGuide och TripAdvisor är öppna plattformar med ett brett utbud från många leverantörer — kvalitet och upplägg varierar beroende på vem du bokar med. Private Tours är en kurerad plattform där varje guide är auktoriserad och personligen granskad, varje upplevelse är helt privat utan okända deltagare, och vi tar fullt ansvar för kvalitet och logistik från start till mål.",
            },
            "q3": {
                "question": "Kan ni skapa skräddarsydda turer eller flerdagarsupplägg?",
                "answer": "Ja. Tack vare vårt breda nationella nätverk av auktoriserade guider och upplevelser kan vi skapa skräddarsydda turer som få andra kan erbjuda — från tematiska fördjupningar till flerdagarsupplägg och VIP-paket. För den här typen av förfrågningar ber vi dig fylla i vårt kontaktformulär så återkommer vi med ett anpassat förslag.",
            },
            "q4": {
                "question": "Erbjuder ni mat- och kulinariska upplevelser?",
                "answer": "Ja. Flera av våra privata turer kombinerar historisk guidning med svenska kulinariska traditioner och matupplevelser. Exakta aktiviteter och eventuella matteman anges i respektive turs beskrivning. Skräddarsydda matupplevelser kan också beställas separat.",
            },
            "q5": {
                "question": "Tar ni emot företag och B2B-grupper?",
                "answer": "Ja. Private Tours erbjuder privata turer för företag, teambuilding, konferensdeltagare och VIP-gäster. Vi sätter ihop skräddarsydda upplägg baserat på gruppstorlek, syfte och budget. Fyll i vårt kontaktformulär så återkommer vi med ett anpassat förslag.",
            },
        },
        "booking": {
            "q1": {
                "question": "Vad behöver jag tänka på när jag bokar?",
                "answer": "Vid bokning väljer du upplevelse, datum, språk och gruppstorlek. Har du specifika önskemål utöver det är du välkommen att kontakta oss direkt. Sista-minuten-bokningar kan ibland ordnas — kontakta oss i så fall.",
            },
            "q2": {
                "question": "Hur långt i förväg bör jag boka?",
                "answer": "Vi rekommenderar att boka så tidigt som möjligt — gärna flera månader i förväg under högsäsong (maj–september) samt kring storhelger. Vissa av våra turer är mycket populära och blir snabbt fullbokade. Tidig bokning säkrar rätt guide, rätt språk och rätt datum.",
            },
            "q3": {
                "question": "Kan jag se guidens profil innan jag bokar?",
                "answer": "Det beror på turen. För vissa turer visas guidens profil direkt — för andra tilldelas du en guide efter bokning, vars profil du då får tillgång till. Oavsett guide kan du vara trygg med att den är auktoriserad och specifikt verifierad för just den turen.",
            },
            "q4": {
                "question": "Kan jag boka som ensam resenär, par eller familj?",
                "answer": "Ja. Privata turer hos Private Tours passar ensamresenärer, par, familjer och grupper — upplevelsen anpassas alltid efter er. Information om vad som gäller för barn framgår tydligt i varje turs beskrivning.",
            },
            "q5": {
                "question": "Vilka betalningsmetoder accepterar ni?",
                "answer": "Vi accepterar Visa och Mastercard med högsta säkerhetsstandard för onlinebetalningar. Full betalning krävs vid bokningstillfället. Alla priser är transparenta och visas i aktuell valuta — inga dolda avgifter.",
            },
            "q6": {
                "question": "Vad ingår i priset?",
                "answer": "Priset inkluderar den privata guidningen, all planering och förberedelse samt guidens närvaro under hela turen. Alla avgifter och eventuella tillägg framgår tydligt i varje turs beskrivning.",
            },
        },
        "afterBooking": {
            "q1": {
                "question": "Vad händer efter att jag har bokat en privat tur?",
                "answer": "Direkt efter bokning får du en bekräftelse via e-post med mötesplats, tid och praktisk information om turen. En guide tilldelas därefter ditt uppdrag och kontaktar dig med sina uppgifter inför turen. Du behöver inte skriva ut något — bekräftelsen visas på telefon.",
            },
            "q2": {
                "question": "Var startar en privat tur?",
                "answer": "Startplats och praktisk information framgår i varje turs beskrivning. Vid upphämtning eller möte på annan plats kontaktar din tilldelade guide dig efter bokningsbekräftelsen med alla detaljer.",
            },
            "q3": {
                "question": "Kan turen starta vid mitt hotell eller en annan plats jag väljer?",
                "answer": "Det beror på turen — om upphämtning eller anpassad startplats är möjligt framgår tydligt i varje turs beskrivning. Tänk på att en anpassad startplats kan påverka turens upplägg.",
            },
            "q4": {
                "question": "Behöver jag skriva ut en biljett?",
                "answer": "Nej. Ingen utskriven biljett krävs — din digitala bokningsbekräftelse på telefon räcker. Våra guider bär profilkläder så att du enkelt känner igen dem på mötesplatsen.",
            },
        },
        "cancellation": {
            "q1": {
                "question": "Vad är avbokningspolicyn för privata turer?",
                "answer": "Varje tur har egna avbokningsvillkor som visas vid bokning och på tur-sidan. Exakta regler för återbetalning och ombokning beror på hur nära turdatumet du avbokar och på den specifika turen. Vi visar alltid dessa regler transparent innan du bekräftar din bokning. Vid force majeure eller guide-avbokning kontaktar vi alltid dig proaktivt.",
            },
            "q2": {
                "question": "Hur avbokar jag och hur lång tid tar återbetalningen?",
                "answer": "Avbokning görs via e-post till oss med ditt bokningsnummer — återbetalningen initieras omgående enligt de avbokningsvillkor som visades vid bokning. Återbetalningar syns vanligtvis på ditt konto inom 2–5 bankdagar, beroende på din bank och betalningsmetod.",
            },
            "q3": {
                "question": "Kan jag boka om min tur istället för att avboka?",
                "answer": "Ja. Vi gör alltid vårt yttersta för att hitta en lösning som passar dig — kontakta oss så tidigt som möjligt. Specifika ombokningsvillkor varierar per tur och följer den turens avbokningspolicy.",
            },
            "q4": {
                "question": "Vad händer om jag missar turen utan att avboka?",
                "answer": "Om du uteblir utan avbokning (no-show) utgår ingen återbetalning, eftersom guiden är fullt engagerad och väntar. Kontakta guiden direkt om du är försenad — vi gör alltid vårt bästa att hitta en lösning om du hör av dig i tid.",
            },
            "q5": {
                "question": "Vad händer vid extremväder eller force majeure?",
                "answer": "Vid extremväder eller force majeure erbjuder Private Tours alltid kostnadsfri ombokningsmöjlighet eller full återbetalning. Vi kontaktar dig proaktivt i sådana situationer — du behöver aldrig oroa dig för att förlora pengar vid händelser utanför din kontroll.",
            },
            "q6": {
                "question": "Vad händer om guiden måste avboka?",
                "answer": "Om vår guide avbokar kontaktar vi dig omgående och erbjuder antingen en likvärdig alternativ auktoriserad guide eller full återbetalning — utan extra kostnad. Vi löser alltid detta innan din turdag.",
            },
        },
        "experience": {
            "q1": {
                "question": "Hur länge varar en privat tur?",
                "answer": "De flesta privata turer hos Private Tours varar 2–8 timmar beroende på upplevelse. Varaktigheten anges tydligt i varje turs beskrivning.",
            },
            "q2": {
                "question": "Vilka språk erbjuds privata turer på?",
                "answer": "Private Tours erbjuder privata turer på de flesta stora världsspråk. Tillgängliga språk för varje specifik tur framgår tydligt i turens beskrivning.",
            },
            "q3": {
                "question": "Är privata turer lämpliga för barn och familjer?",
                "answer": "Ja. Privata turer kan anpassas för familjer med barn i alla åldrar. Information om vad som gäller för barn framgår tydligt i varje turs beskrivning.",
            },
            "q4": {
                "question": "Genomförs turer i alla väderförhållanden?",
                "answer": "Ja. Privata turer genomförs året runt och i de flesta väderförhållanden — klä dig efter årstiden. Vid extremt väder som gör turen omöjlig kontaktar vi dig i förväg och erbjuder kostnadsfri ombokningsmöjlighet.",
            },
            "q5": {
                "question": "Är turerna tillgänglighetsanpassade för gäster med rörelsebehov?",
                "answer": "Tillgänglighetsinformation — gångavstånd, terräng och fysiska krav — anges tydligt i varje turs beskrivning. Eftersom alla turer är privata har du alltid full flexibilitet att anpassa upplägget efter dina behov. Du är även välkommen att kontakta oss om du har frågor.",
            },
        },
        "about": {
            "q1": {
                "question": "Vad är Private Tours?",
                "answer": "Private Tours är en kurerad plattform för privata guidade turer i Sverige. Vi förenar resenärer med auktoriserade guider och verifierade experter för upplevelser som är personliga, tillförlitliga och genomtänkta från start till mål. Varje guide är handplockad — vi tar fullt ansvar för kvaliteten i varje tur vi erbjuder.",
            },
            "q2": {
                "question": "Hur arbetar Private Tours med ansvarsfull turism?",
                "answer": "Private Tours samarbetar uteslutande med lokala, auktoriserade guider och experter och stödjer aktivt lokala initiativ och evenemang. Alla våra turer är privata — aldrig massgrupper. Vi respekterar de miljöer och gemenskaper vi besöker och behandlar kulturarv som ett ansvar, inte en dekoration.",
            },
        },
    },
}

# ============================================================================
# DE — AI-translated from polished EN, formal "Sie" register, glossary aligned
# with existing de.json (autorisiert, verifiziert, etc.)
# ============================================================================
DE_FAQ = {
    "title": "Häufig Gestellte Fragen",
    "description": "Antworten zu privaten Touren in Schweden — Buchung, Guides, Stornierung und was Sie erwartet.",
    "subtitle": "Alles, was Sie über unsere privaten Touren in ganz Schweden wissen müssen",
    "categories": {
        "understanding": "Private Tours verstehen",
        "comparing": "Vergleichen & Wählen",
        "booking": "Buchen",
        "afterBooking": "Nach der Buchung",
        "cancellation": "Stornierung, Erstattung & Änderungen",
        "experience": "Das Tour-Erlebnis",
        "about": "Über Private Tours",
    },
    "stillHaveQuestions": "Noch Fragen?",
    "contactDescription": "Unser Team hilft Ihnen gerne bei der Planung Ihrer perfekten privaten Tour.",
    "contactUs": "Kontaktieren Sie Uns",
    "questions": {
        "understanding": {
            "q1": {
                "question": "Was ist eine private geführte Tour?",
                "answer": "Eine private geführte Tour ist ein Erlebnis, bei dem Sie und Ihre Gruppe allein mit einem autorisierten Guide unterwegs sind — keine anderen Teilnehmer. Die Tour folgt einem sorgfältig geplanten Ablauf mit voller Flexibilität, Tempo und Schwerpunkt an Ihre Gruppe anzupassen. Private Tours bietet ausschließlich private Touren an, niemals offene Gruppentouren.",
            },
            "q2": {
                "question": "Wie funktioniert eine private Tour — Schritt für Schritt?",
                "answer": "Eine private Tour mit Private Tours läuft in vier Schritten ab: (1) Sie wählen Ihr Erlebnis, Datum, Sprache und Gruppengröße über unsere Buchungsplattform, (2) Sie erhalten eine Buchungsbestätigung und einer unserer Guides kontaktiert Sie vor der Tour, (3) der Guide trifft Sie gemäß den Touranweisungen oder an einem vereinbarten Ort, (4) nach der Tour freuen wir uns über Ihr Feedback, um unsere Qualitätsstandards zu wahren.",
            },
            "q3": {
                "question": "Was ist der Unterschied zwischen einer privaten Tour und einer Gruppentour?",
                "answer": "Eine private Tour bedeutet, dass Sie und Ihre Gruppe allein mit dem Guide unterwegs sind — keine andere Gruppe ist beteiligt. Die Tour folgt einem Ablauf, wird aber an das Tempo und die Interessen Ihrer Gruppe angepasst. Eine Gruppentour teilen Sie mit unbekannten Teilnehmern und haben begrenzten Einfluss auf den Verlauf.",
            },
            "q4": {
                "question": "Was bedeutet ein autorisierter Guide?",
                "answer": "Ein autorisierter Guide ist ein professionell zertifizierter Guide mit anerkannter Ausbildung, geprüften Sprachkenntnissen und verifizierter beruflicher Kompetenz. Private Tours arbeitet ausschließlich mit autorisierten Guides und verifizierten Experten zusammen — niemals mit ungeschulten Guides oder Freiwilligen.",
            },
            "q5": {
                "question": "Woher weiß ich, dass die Tour von hoher Qualität sein wird?",
                "answer": "Qualität bei Private Tours beginnt mit der Auswahl — jeder Guide ist autorisiert, persönlich geprüft und von uns freigegeben. Wir sammeln nach jeder Tour Feedback und handeln sofort, wenn etwas unter unserem Standard liegt.",
            },
        },
        "comparing": {
            "q1": {
                "question": "Welche private Tour ist die beste für mich?",
                "answer": "Die richtige private Tour hängt davon ab, was Sie erleben möchten (Geschichte, Essen, Architektur, Natur), wie viel Zeit Sie haben (2–8 Stunden oder mehrtägige Programme) und der Zusammensetzung Ihrer Gruppe. Kontaktieren Sie uns, wenn Sie unsicher sind — wir helfen Ihnen, Ihre Wünsche mit dem richtigen Guide und der richtigen Tour abzugleichen.",
            },
            "q2": {
                "question": "Warum sollte ich Private Tours statt GetYourGuide, TripAdvisor oder kostenlosen Touren wählen?",
                "answer": "GetYourGuide und TripAdvisor sind offene Plattformen mit einem breiten Angebot vieler verschiedener Anbieter — Qualität und Format variieren je nach Anbieter. Private Tours ist eine kuratierte Plattform, auf der jeder Guide autorisiert und persönlich geprüft ist, jedes Erlebnis vollständig privat ohne unbekannte Teilnehmer stattfindet und wir die volle Verantwortung für Qualität und Logistik von Anfang bis Ende übernehmen.",
            },
            "q3": {
                "question": "Können Sie individuelle Touren oder mehrtägige Programme erstellen?",
                "answer": "Ja. Dank unseres umfangreichen nationalen Netzwerks autorisierter Guides und Erlebnisse können wir maßgeschneiderte Touren erstellen, die nur wenige andere anbieten können — von thematischen Vertiefungen bis zu mehrtägigen Programmen und VIP-Paketen. Für solche Anfragen füllen Sie bitte unser Kontaktformular aus, und wir kommen mit einem individuellen Vorschlag auf Sie zurück.",
            },
            "q4": {
                "question": "Bieten Sie Essens- und kulinarische Erlebnisse an?",
                "answer": "Ja. Mehrere unserer privaten Touren verbinden historische Führungen mit schwedischen kulinarischen Traditionen und Essenserlebnissen. Konkrete Aktivitäten und Essensthemen sind in der jeweiligen Tourbeschreibung detailliert aufgeführt. Maßgeschneiderte kulinarische Erlebnisse können auch separat arrangiert werden.",
            },
            "q5": {
                "question": "Nehmen Sie Firmenkunden und B2B-Gruppen an?",
                "answer": "Ja. Private Tours bietet private Touren für Unternehmen, Teambuilding, Konferenzteilnehmer und VIP-Gäste an. Wir stellen maßgeschneiderte Pakete basierend auf Gruppengröße, Zweck und Budget zusammen. Füllen Sie unser Kontaktformular aus, und wir kommen mit einem individuellen Vorschlag auf Sie zurück.",
            },
        },
        "booking": {
            "q1": {
                "question": "Was muss ich bei der Buchung beachten?",
                "answer": "Bei der Buchung wählen Sie Ihr Erlebnis, Datum, Sprache und Gruppengröße. Wenn Sie darüber hinaus spezifische Wünsche haben, sind Sie willkommen, uns direkt zu kontaktieren. Last-Minute-Buchungen sind manchmal möglich — kontaktieren Sie uns in diesem Fall.",
            },
            "q2": {
                "question": "Wie weit im Voraus sollte ich buchen?",
                "answer": "Wir empfehlen, so früh wie möglich zu buchen — idealerweise mehrere Monate im Voraus während der Hauptsaison (Mai–September) und an wichtigen Feiertagen. Einige unserer Touren sind sehr beliebt und schnell ausgebucht. Eine frühzeitige Buchung sichert den richtigen Guide, die richtige Sprache und das richtige Datum.",
            },
            "q3": {
                "question": "Kann ich das Profil des Guides vor der Buchung sehen?",
                "answer": "Das hängt von der Tour ab. Bei einigen Touren wird das Profil des Guides direkt angezeigt — bei anderen wird ein Guide nach der Buchung zugewiesen, dessen Profil Sie dann einsehen können. Unabhängig davon, welchen Guide Sie erhalten, können Sie sicher sein, dass er autorisiert und speziell für diese Tour verifiziert ist.",
            },
            "q4": {
                "question": "Kann ich als Alleinreisender, Paar oder Familie buchen?",
                "answer": "Ja. Private Touren mit Private Tours eignen sich für Alleinreisende, Paare, Familien und Gruppen — das Erlebnis wird stets an Sie angepasst. Informationen darüber, was für Kinder gilt, sind in jeder Tourbeschreibung klar angegeben.",
            },
            "q5": {
                "question": "Welche Zahlungsmethoden akzeptieren Sie?",
                "answer": "Wir akzeptieren Visa und Mastercard mit höchsten Sicherheitsstandards für Online-Zahlungen. Eine vollständige Zahlung ist zum Zeitpunkt der Buchung erforderlich. Alle Preise sind transparent und werden in der jeweiligen Währung angezeigt — keine versteckten Gebühren.",
            },
            "q6": {
                "question": "Was ist im Preis enthalten?",
                "answer": "Der Preis umfasst das private geführte Erlebnis, die gesamte Planung und Vorbereitung sowie die Anwesenheit des Guides während der gesamten Tour. Alle Gebühren und etwaige Zusatzkosten sind in jeder Tourbeschreibung klar angegeben.",
            },
        },
        "afterBooking": {
            "q1": {
                "question": "Was passiert, nachdem ich eine private Tour gebucht habe?",
                "answer": "Unmittelbar nach der Buchung erhalten Sie eine Bestätigung per E-Mail mit Treffpunkt, Uhrzeit und praktischen Informationen zur Tour. Anschließend wird Ihrer Buchung ein Guide zugewiesen, der Sie vor der Tour mit seinen Kontaktdaten erreicht. Sie müssen nichts ausdrucken — die Bestätigung können Sie auf Ihrem Telefon vorzeigen.",
            },
            "q2": {
                "question": "Wo beginnt eine private Tour?",
                "answer": "Treffpunkt und praktische Informationen werden in jeder Tourbeschreibung angegeben. Bei Abholungen oder Treffen an alternativen Orten kontaktiert Sie Ihr zugewiesener Guide nach der Buchungsbestätigung mit allen Details.",
            },
            "q3": {
                "question": "Kann die Tour an meinem Hotel oder einem anderen Ort meiner Wahl beginnen?",
                "answer": "Das hängt von der Tour ab — ob Abholung oder ein individueller Startpunkt möglich ist, ist in jeder Tourbeschreibung klar angegeben. Bitte beachten Sie, dass ein angepasster Startpunkt den Ablauf der Tour beeinflussen kann.",
            },
            "q4": {
                "question": "Muss ich ein Ticket ausdrucken?",
                "answer": "Nein. Es ist kein ausgedrucktes Ticket erforderlich — Ihre digitale Buchungsbestätigung auf Ihrem Telefon genügt. Unsere Guides tragen Markenkleidung, sodass Sie sie am Treffpunkt leicht erkennen können.",
            },
        },
        "cancellation": {
            "q1": {
                "question": "Was ist die Stornierungsrichtlinie für private Touren?",
                "answer": "Jede Tour hat ihre eigenen Stornierungsbedingungen, die bei der Buchung und auf der Tour-Seite angezeigt werden. Die genauen Erstattungs- und Umbuchungsregeln hängen davon ab, wie nah am Tour-Termin Sie stornieren, sowie von der jeweiligen Tour. Wir zeigen diese Regeln stets transparent an, bevor Sie Ihre Buchung bestätigen. Bei höherer Gewalt oder einer Stornierung durch den Guide kontaktieren wir Sie immer proaktiv.",
            },
            "q2": {
                "question": "Wie storniere ich, und wie lange dauert eine Erstattung?",
                "answer": "Stornierungen erfolgen per E-Mail an uns mit Ihrer Buchungsreferenz — die Erstattung wird gemäß den bei der Buchung angezeigten Stornierungsbedingungen sofort eingeleitet. Erstattungen erscheinen üblicherweise innerhalb von 2–5 Bankarbeitstagen auf Ihrem Konto, abhängig von Ihrer Bank und Zahlungsmethode.",
            },
            "q3": {
                "question": "Kann ich meine Tour umbuchen, anstatt sie zu stornieren?",
                "answer": "Ja. Wir tun stets unser Möglichstes, eine passende Lösung zu finden — kontaktieren Sie uns so früh wie möglich. Spezifische Umbuchungsbedingungen variieren je nach Tour und folgen der Stornierungsrichtlinie der jeweiligen Tour.",
            },
            "q4": {
                "question": "Was passiert, wenn ich die Tour ohne Stornierung verpasse?",
                "answer": "Wenn Sie ohne Stornierung nicht erscheinen (No-Show), erfolgt keine Erstattung, da der Guide vollständig eingeplant ist und wartet. Kontaktieren Sie den Guide direkt, falls Sie sich verspäten — wir geben stets unser Bestes, eine Lösung zu finden, wenn Sie sich rechtzeitig melden.",
            },
            "q5": {
                "question": "Was passiert bei extremem Wetter oder höherer Gewalt?",
                "answer": "Bei extremem Wetter oder höherer Gewalt bietet Private Tours stets eine kostenlose Umbuchungsmöglichkeit oder eine vollständige Erstattung an. Wir kontaktieren Sie in solchen Situationen proaktiv — Sie müssen sich nie Sorgen machen, durch Ereignisse außerhalb Ihrer Kontrolle Geld zu verlieren.",
            },
            "q6": {
                "question": "Was passiert, wenn der Guide stornieren muss?",
                "answer": "Wenn unser Guide storniert, kontaktieren wir Sie umgehend und bieten entweder einen gleichwertigen, autorisierten Ersatzguide oder eine vollständige Erstattung an — ohne zusätzliche Kosten. Wir lösen dies stets vor Ihrem Tour-Tag.",
            },
        },
        "experience": {
            "q1": {
                "question": "Wie lange dauert eine private Tour?",
                "answer": "Die meisten privaten Touren mit Private Tours dauern je nach Erlebnis 2–8 Stunden. Die Dauer ist in jeder Tourbeschreibung klar angegeben.",
            },
            "q2": {
                "question": "In welchen Sprachen werden private Touren angeboten?",
                "answer": "Private Tours bietet private Touren in den meisten großen Weltsprachen an. Die verfügbaren Sprachen für jede einzelne Tour sind in der Tourbeschreibung klar angegeben.",
            },
            "q3": {
                "question": "Sind private Touren für Kinder und Familien geeignet?",
                "answer": "Ja. Private Touren können für Familien mit Kindern jeden Alters angepasst werden. Informationen darüber, was für Kinder gilt, sind in jeder Tourbeschreibung klar angegeben.",
            },
            "q4": {
                "question": "Finden Touren bei jedem Wetter statt?",
                "answer": "Ja. Private Touren finden ganzjährig und bei den meisten Witterungsbedingungen statt — kleiden Sie sich der Jahreszeit entsprechend. Bei extremem Wetter, das die Tour unmöglich macht, kontaktieren wir Sie im Voraus und bieten eine kostenlose Umbuchungsmöglichkeit an.",
            },
            "q5": {
                "question": "Sind die Touren für Gäste mit Mobilitätseinschränkungen zugänglich?",
                "answer": "Zugänglichkeitsinformationen — Gehstrecken, Gelände und körperliche Anforderungen — sind in jeder Tourbeschreibung klar angegeben. Da alle Touren privat sind, haben Sie stets die volle Flexibilität, das Erlebnis an Ihre Bedürfnisse anzupassen. Sie sind auch jederzeit willkommen, uns bei Fragen zu kontaktieren.",
            },
        },
        "about": {
            "q1": {
                "question": "Was ist Private Tours?",
                "answer": "Private Tours ist eine kuratierte Plattform für private geführte Touren in Schweden. Wir verbinden Reisende mit autorisierten Guides und verifizierten Experten für Erlebnisse, die persönlich, zuverlässig und durchdacht von Anfang bis Ende gestaltet sind. Jeder Guide ist handverlesen — wir übernehmen die volle Verantwortung für die Qualität jeder Tour, die wir anbieten.",
            },
            "q2": {
                "question": "Wie arbeitet Private Tours mit verantwortungsvollem Tourismus?",
                "answer": "Private Tours arbeitet ausschließlich mit lokalen, autorisierten Guides und Experten zusammen und unterstützt aktiv lokale Initiativen und Veranstaltungen. Alle unsere Touren sind privat — niemals Massenangebote. Wir respektieren die Umgebungen und Gemeinschaften, die wir besuchen, und behandeln kulturelles Erbe als Verantwortung, nicht als Kulisse.",
            },
        },
    },
}


def update_locale(path: Path, new_faq: dict) -> None:
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    data["faq"] = new_faq
    out = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    path.write_text(out, encoding="utf-8")
    print(f"  updated: {path}")


def main() -> int:
    print("Replacing FAQ blocks in 3 locale files...")
    update_locale(MESSAGES_DIR / "en.json", EN_FAQ)
    update_locale(MESSAGES_DIR / "sv.json", SV_FAQ)
    update_locale(MESSAGES_DIR / "de.json", DE_FAQ)

    # Sanity: confirm question counts match plan
    expected = {
        "understanding": 5,
        "comparing": 5,
        "booking": 6,
        "afterBooking": 4,
        "cancellation": 6,
        "experience": 5,
        "about": 2,
    }
    for locale in ("en", "sv", "de"):
        data = json.loads((MESSAGES_DIR / f"{locale}.json").read_text(encoding="utf-8"))
        for cat, count in expected.items():
            actual = len(data["faq"]["questions"][cat])
            assert actual == count, f"{locale}.{cat}: expected {count} q's, got {actual}"
    print("  q-count sanity passed (5/5/6/4/6/5/2 across all locales)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
