## i18n (Internationalization) – Enterprise kapsam

i18n’de enterprise farkı “çok dil” değil, **deterministik davranış + ölçeklenebilirlik + gözlemlenebilirlik**tir.

Birinci katman **language resolution modeli**dir.
Locale resolution; user → tenant → request → system fallback zincirini açık, override edilebilir ve test edilebilir şekilde tanımlamalı. “en-US → en → default” gibi örtük davranışlar konfigürasyonsuz olmamalı.

İkinci katman **data lifecycle**.
Translation kaynağı sadece JSON değildir. Dosya, CDN, remote service, database gibi farklı provider’lar tek bir abstraction altında birleşmeli. Lazy load, hot reload, partial invalidate ve version pinning desteklenmeli. Enterprise ortamda “deploy = language freeze” varsayımı geçersizdir.

Üçüncü katman **formatting ve semantics**.
ICU veya muadili sadece bir alt yetenektir. Sayı, tarih, para, ölçü birimi, liste ve relative time formatting locale-aware olmalı ama override edilebilir olmalı. “Legal / financial” bağlamlarda rounding ve separator farkları kritik olur.

Dördüncü katman **fallback ve failure semantics**.
Missing key davranışı sessiz olmamalı. Runtime policy seçilebilir olmalı: throw, warn, noop, placeholder. Prod ortamda sessizce İngilizce’ye düşmek çoğu enterprise için kabul edilemez. Fallback zinciri gözlemlenebilir olmalı.

Beşinci katman **observability**.
i18n bir “data plane”dir. Parse hit/miss, fallback rate, missing key density, locale distribution gibi metrikler üretmeli. Bunlar feature değil, operasyonel gerekliliktir. Aksi halde prod’da i18n kördür.

Altıncı katman **performance determinism**.
Cold start, worst-case lookup ve memory footprint üst sınırları dokümante edilmeli. AST cache, string interning, shared snapshot gibi teknikler opsiyonel değil; büyük tenant’larda zorunludur.

Yedinci katman **governance**.
Key naming convention enforcement, deprecated key yönetimi, unused key detection ve CI-time validation. Enterprise sistemlerde i18n dosyası “free text” değildir; yönetilen bir artefakttır.

---

## a11y (Accessibility) – Enterprise kapsam

a11y tarafında enterprise farkı “etiket eklemek” değil, **regülasyon uyumu + sürdürülebilir denetim**tir.

Birinci katman **standart uyum matrisi**dir.
WCAG 2.1 AA minimum kabul edilir. Ancak enterprise bağlamda **region-aware compliance** gerekir (EN 301 549, Section 508 gibi). Framework bunu konfigürasyonla ifade edebilmeli.

İkinci katman **programatik a11y API’leri**.
ARIA role, state ve property’ler manuel string olarak değil; typed / validated API üzerinden sağlanmalı. Yanlış kombinasyonlar runtime’da değil, mümkünse build-time’da yakalanmalı.

Üçüncü katman **focus ve navigation modeli**.
Tab order, roving tabindex, modal focus trapping ve escape semantics framework seviyesinde tanımlı olmalı. Component yazarının “unutmasına” izin verilmemeli.

Dördüncü katman **screen reader determinism**.
SR output’un tahmin edilebilir olması gerekir. Dynamic content update (aria-live), async state change ve virtualization senaryoları için net bir contract olmalı. Enterprise uygulamalarda SR regression kabul edilmez.

Beşinci katman **testability**.
a11y otomatik test edilebilir olmalı. Axe, Lighthouse veya custom rule engine entegrasyonu sadece tool değil; CI gate olmalı. “Best effort” değil, enforce edilen kalite.

Altıncı katman **telemetry ve auditability**.
Prod ortamda a11y ihlalleri gözlemlenebilir olmalı. En azından violation count, critical rule breach ve component-level attribution. Regülasyon denetimlerinde “kanıt” gerekir.

Yedinci katman **content + i18n entegrasyonu**.
Localized string’lerin a11y açısından güvenli olması gerekir. Dil değiştiğinde aria-label, alt text, hint ve error message’ların da senkron değişmesi garanti edilmelidir. i18n ve a11y ayrı paketler olsa bile semantik olarak kopuk olmamalılar.

---

## Kritik ama sık atlanan noktalar

- RTL yalnızca layout değil; focus order ve SR output’u da etkiler
- Pluralization hataları a11y ihlaline dönüşebilir
- Dynamic language switch sırasında focus ve SR state reset edilmezse ciddi bug çıkar
- “Fallback text” çoğu zaman accessibility regression üretir

---

## Net çerçeve

Enterprise-grade i18n + a11y şu anlama gelir:

- Davranışları **konfigüre edilebilir ama deterministik**
- Hataları **sessiz değil, ölçülebilir**
- Runtime’da **sürpriz üretmeyen**
- Denetlenebilir ve regülasyon uyumlu
- Component yazarına değil, **platforma güvenen**
