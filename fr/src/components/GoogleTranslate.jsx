import { useEffect, useState } from "react";

const LANGUAGES = [
    { label: "Afrikaans", code: "af", flag: "🇿🇦" },
    { label: "Albanian", code: "sq", flag: "🇦🇱" },
    { label: "Amharic", code: "am", flag: "🇪🇹" },
    { label: "Arabic", code: "ar", flag: "🇸🇦" },
    { label: "Armenian", code: "hy", flag: "🇦🇲" },
    { label: "Azerbaijani", code: "az", flag: "🇦🇿" },
    { label: "Basque", code: "eu", flag: "🇪🇸" },
    { label: "Belarusian", code: "be", flag: "🇧🇾" },
    { label: "Bengali", code: "bn", flag: "🇧🇩" },
    { label: "Bosnian", code: "bs", flag: "🇧🇦" },
    { label: "Bulgarian", code: "bg", flag: "🇧🇬" },
    { label: "Catalan", code: "ca", flag: "🇪🇸" },
    { label: "Cebuano", code: "ceb", flag: "🇵🇭" },
    { label: "Chinese (Simplified)", code: "zh-CN", flag: "🇨🇳" },
    { label: "Chinese (Traditional)", code: "zh-TW", flag: "🇹🇼" },
    { label: "Corsican", code: "co", flag: "🇫🇷" },
    { label: "Croatian", code: "hr", flag: "🇭🇷" },
    { label: "Czech", code: "cs", flag: "🇨🇿" },
    { label: "Danish", code: "da", flag: "🇩🇰" },
    { label: "Dutch", code: "nl", flag: "🇳🇱" },
    { label: "English", code: "en", flag: "🇬🇧" },
    { label: "Esperanto", code: "eo", flag: "🏳️" },
    { label: "Estonian", code: "et", flag: "🇪🇪" },
    { label: "Finnish", code: "fi", flag: "🇫🇮" },
    { label: "French", code: "fr", flag: "🇫🇷" },
    { label: "Frisian", code: "fy", flag: "🇳🇱" },
    { label: "Galician", code: "gl", flag: "🇪🇸" },
    { label: "Georgian", code: "ka", flag: "🇬🇪" },
    { label: "German", code: "de", flag: "🇩🇪" },
    { label: "Greek", code: "el", flag: "🇬🇷" },
    { label: "Gujarati", code: "gu", flag: "🇮🇳" },
    { label: "Haitian Creole", code: "ht", flag: "🇭🇹" },
    { label: "Hausa", code: "ha", flag: "🇳🇬" },
    { label: "Hawaiian", code: "haw", flag: "🇺🇸" },
    { label: "Hebrew", code: "iw", flag: "🇮🇱" },
    { label: "Hindi", code: "hi", flag: "🇮🇳" },
    { label: "Hmong", code: "hmn", flag: "🇨🇳" },
    { label: "Hungarian", code: "hu", flag: "🇭🇺" },
    { label: "Icelandic", code: "is", flag: "🇮🇸" },
    { label: "Igbo", code: "ig", flag: "🇳🇬" },
    { label: "Indonesian", code: "id", flag: "🇮🇩" },
    { label: "Irish", code: "ga", flag: "🇮🇪" },
    { label: "Italian", code: "it", flag: "🇮🇹" },
    { label: "Japanese", code: "ja", flag: "🇯🇵" },
    { label: "Javanese", code: "jw", flag: "🇮🇩" },
    { label: "Kannada", code: "kn", flag: "🇮🇳" },
    { label: "Kazakh", code: "kk", flag: "🇰🇿" },
    { label: "Khmer", code: "km", flag: "🇰🇭" },
    { label: "Korean", code: "ko", flag: "🇰🇷" },
    { label: "Kurdish", code: "ku", flag: "🇹🇷" },
    { label: "Kyrgyz", code: "ky", flag: "🇰🇬" },
    { label: "Lao", code: "lo", flag: "🇱🇦" },
    { label: "Latin", code: "la", flag: "🇻🇦" },
    { label: "Latvian", code: "lv", flag: "🇱🇻" },
    { label: "Lithuanian", code: "lt", flag: "🇱🇹" },
    { label: "Luxembourgish", code: "lb", flag: "🇱🇺" },
    { label: "Macedonian", code: "mk", flag: "🇲🇰" },
    { label: "Malagasy", code: "mg", flag: "🇲🇬" },
    { label: "Malay", code: "ms", flag: "🇲🇾" },
    { label: "Malayalam", code: "ml", flag: "🇮🇳" },
    { label: "Maltese", code: "mt", flag: "🇲🇹" },
    { label: "Maori", code: "mi", flag: "🇳🇿" },
    { label: "Marathi", code: "mr", flag: "🇮🇳" },
    { label: "Mongolian", code: "mn", flag: "🇲🇳" },
    { label: "Myanmar (Burmese)", code: "my", flag: "🇲🇲" },
    { label: "Nepali", code: "ne", flag: "🇳🇵" },
    { label: "Norwegian", code: "no", flag: "🇳🇴" },
    { label: "Nyanja (Chichewa)", code: "ny", flag: "🇲🇼" },
    { label: "Pashto", code: "ps", flag: "🇦🇫" },
    { label: "Persian", code: "fa", flag: "🇮🇷" },
    { label: "Polish", code: "pl", flag: "🇵🇱" },
    { label: "Portuguese", code: "pt", flag: "🇵🇹" },
    { label: "Punjabi", code: "pa", flag: "🇮🇳" },
    { label: "Romanian", code: "ro", flag: "🇷🇴" },
    { label: "Russian", code: "ru", flag: "🇷🇺" },
    { label: "Samoan", code: "sm", flag: "🇼🇸" },
    { label: "Scots Gaelic", code: "gd", flag: "🏴" },
    { label: "Serbian", code: "sr", flag: "🇷🇸" },
    { label: "Sesotho", code: "st", flag: "🇱🇸" },
    { label: "Shona", code: "sn", flag: "🇿🇼" },
    { label: "Sindhi", code: "sd", flag: "🇵🇰" },
    { label: "Sinhala (Sinhalese)", code: "si", flag: "🇱🇰" },
    { label: "Slovak", code: "sk", flag: "🇸🇰" },
    { label: "Slovenian", code: "sl", flag: "🇸🇮" },
    { label: "Somali", code: "so", flag: "🇸🇴" },
    { label: "Spanish", code: "es", flag: "🇪🇸" },
    { label: "Sundanese", code: "su", flag: "🇮🇩" },
    { label: "Swahili", code: "sw", flag: "🇰🇪" },
    { label: "Swedish", code: "sv", flag: "🇸🇪" },
    { label: "Tagalog (Filipino)", code: "tl", flag: "🇵🇭" },
    { label: "Tajik", code: "tg", flag: "🇹🇯" },
    { label: "Tamil", code: "ta", flag: "🇮🇳" },
    { label: "Telugu", code: "te", flag: "🇮🇳" },
    { label: "Thai", code: "th", flag: "🇹🇭" },
    { label: "Turkish", code: "tr", flag: "🇹🇷" },
    { label: "Ukrainian", code: "uk", flag: "🇺🇦" },
    { label: "Urdu", code: "ur", flag: "🇵🇰" },
    { label: "Uzbek", code: "uz", flag: "🇺🇿" },
    { label: "Vietnamese", code: "vi", flag: "🇻🇳" },
    { label: "Welsh", code: "cy", flag: "🏴" },
    { label: "Xhosa", code: "xh", flag: "🇿🇦" },
    { label: "Yiddish", code: "yi", flag: "🇮🇱" },
    { label: "Yoruba", code: "yo", flag: "🇳🇬" },
    { label: "Zulu", code: "zu", flag: "🇿🇦" },
];

const GoogleTranslate = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState("en");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // 1. Inject Styles Programmatically (Backup to CSS)
        const addStyles = () => {
            const style = document.createElement("style");
            style.id = "google-translate-overrides";
            style.innerHTML = `
                .goog-te-banner-frame { display: none !important; }
                .goog-te-gadget { display: none !important; }
                body { top: 0px !important; margin-top: 0px !important; position: static !important; }
                .goog-tooltip { display: none !important; }
                .goog-tooltip:hover { display: none !important; }
                .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
                iframe.goog-te-banner-frame { display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; }
            `;
            if (!document.getElementById("google-translate-overrides")) {
                document.head.appendChild(style);
            }
        };
        addStyles();

        // 2. Initialize Google Translate Script
        if (!document.querySelector("#google-translate-script")) {
            const script = document.createElement("script");
            script.id = "google-translate-script";
            script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
            script.async = true;
            document.body.appendChild(script);

            window.googleTranslateElementInit = () => {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages: LANGUAGES.map((l) => l.code).join(","),
                        autoDisplay: false,
                    },
                    "google_translate_element"
                );
            };
        }

        // 3. MutationObserver for Real-time Cleanup
        const observerCallback = (mutationsList) => {
            for (const mutation of mutationsList) {
                // If Google tries to change body styles (top or margin-top)
                if (mutation.type === "attributes" && mutation.attributeName === "style") {
                    const body = document.body;
                    if (body.style.top !== "0px" || body.style.marginTop !== "0px") {
                        body.style.top = "0px";
                        body.style.marginTop = "0px";
                        body.style.position = ""; // Reset position if Google changes it
                    }
                }

                // If Google injects new nodes (like the banner iframe)
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check for banner frame
                            if (node.classList && (node.classList.contains("goog-te-banner-frame") || node.tagName === "IFRAME")) {
                                if (node.tagName === "IFRAME" && node.classList.contains("goog-te-banner-frame")) {
                                    node.style.display = "none";
                                    node.remove(); // Aggressively remove it
                                }
                            }
                        }
                    });
                }
            }

            // Fallback check to ensure body is clean
            if (document.body.style.top !== "0px") {
                document.body.style.top = "0px";
            }
        };

        const observer = new MutationObserver(observerCallback);

        // Start Observing
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true, // Watch subtree to catch iframe injections anywhere
            attributeFilter: ["style"] // Only watch style changes on body
        });

        // Also watch documentElement (html tag) just in case
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["style"]
        });

        // Initial Cleanup Run
        const initialCleanup = () => {
            const banner = document.querySelector(".goog-te-banner-frame");
            if (banner) {
                banner.style.display = "none";
                banner.remove();
            }
            document.body.style.top = "0px";
            document.body.style.marginTop = "0px";
        };
        initialCleanup();

        return () => {
            observer.disconnect();
            // Optional: remove script if needed, but usually better to leave it in SPAs
        };
    }, []);

    const changeLanguage = (langCode) => {
        const select = document.querySelector(".goog-te-combo");
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event("change"));
            setSelectedLang(langCode);
            setIsOpen(false);
        }
    };

    const filteredLanguages = LANGUAGES.filter((lang) =>
        lang.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative z-50">
            {/* Hidden Native Widget */}
            <div
                id="google_translate_element"
                className="absolute bottom-0 right-0 opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
            />

            {/* Custom Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/50 backdrop-blur-md border border-gray-200 px-4 py-2 rounded-full hover:bg-white/80 transition-all shadow-sm hover:shadow-md hover:border-gray-300 group"
            >
                <span className="text-xl">
                    {LANGUAGES.find((l) => l.code === selectedLang)?.flag || "🌐"}
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {LANGUAGES.find((l) => l.code === selectedLang)?.label || "Language"}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Custom Dropdown Modal */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in slide-in-from-top-2">
                    {/* Search Header */}
                    <div className="p-3 bg-gray-50 border-b border-gray-100">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search language..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Language List */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar p-1">
                        {filteredLanguages.length > 0 ? (
                            <div className="grid grid-cols-1 gap-0.5">
                                {filteredLanguages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className={`flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all ${selectedLang === lang.code
                                            ? "bg-green-50 text-green-700 font-medium"
                                            : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        <span className="text-xl">{lang.flag}</span>
                                        <span className="flex-1">{lang.label}</span>
                                        {selectedLang === lang.code && (
                                            <svg
                                                className="w-4 h-4 text-green-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No languages found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close on click outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default GoogleTranslate;
