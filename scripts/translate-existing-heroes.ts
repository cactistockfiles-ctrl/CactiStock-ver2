// Script to translate existing hero data
// Run with: npx tsx scripts/translate-existing-heroes.ts

async function translateText(text: string, sourceLang: string, targetLang: string) {
  if (!text || text.trim() === "") return "";
  if (sourceLang === targetLang) return text;

  const response = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`,
  );
  const data = await response.json();

  if (data.responseStatus === 200) {
    return data.responseData.translatedText;
  }
  return text;
}

async function translateToAllLanguages(
  text: string,
  sourceLang: string,
  targetLangs: string[],
) {
  const translations: Record<string, string> = { [sourceLang]: text };

  for (const targetLang of targetLangs) {
    if (targetLang !== sourceLang) {
      translations[targetLang] = await translateText(text, sourceLang, targetLang);
      console.log(`  Translated to ${targetLang}: ${translations[targetLang]}`);
    }
  }

  return translations;
}

async function main() {
  console.log("Fetching existing heroes...");
  const heroesRes = await fetch("http://localhost:7400/api/admin/heroes");
  const heroes = await heroesRes.json();

  console.log(`Found ${heroes.length} heroes`);

  for (const hero of heroes) {
    console.log(`\nProcessing hero: ${hero.id}`);
    console.log(`Title: ${hero.title}`);
    console.log(`Subtitle: ${hero.subtitle}`);

    // Assume source language is Thai (th) - you can change this
    const sourceLang = "th";
    const targetLangs = ["en", "zh", "id"];

    // Translate title
    const titleTranslations = await translateToAllLanguages(
      hero.title,
      sourceLang,
      targetLangs,
    );

    // Translate subtitle
    const subtitleTranslations = await translateToAllLanguages(
      hero.subtitle,
      sourceLang,
      targetLangs,
    );

    // Translate button labels
    const buttonLabelTranslations = await translateToAllLanguages(
      hero.buttonLabel,
      sourceLang,
      targetLangs,
    );

    const secondaryButtonLabelTranslations = await translateToAllLanguages(
      hero.secondaryButtonLabel,
      sourceLang,
      targetLangs,
    );

    // Update hero with translations
    const updatedHero = {
      ...hero,
      titleTranslations,
      subtitleTranslations,
      buttonLabelTranslations,
      secondaryButtonLabelTranslations,
    };

    console.log("Updating hero in database...");
    await fetch("http://localhost:7400/api/admin/heroes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedHero),
    });

    console.log(`✓ Updated hero: ${hero.id}`);
  }

  console.log("\n✓ All heroes translated successfully!");
}

main().catch(console.error);
