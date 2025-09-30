// District name mapping from English to Hindi (Devanagari script)
export const DISTRICT_HINDI_MAPPING: Record<string, string> = {
  // Rajasthan Districts
  "Ajmer": "अजमेर",
  "Alwar": "अलवर",
  "Balotra": "बलोतरा",
  "Banswara": "बांसवाड़ा",
  "Baran": "बारां",
  "Barmer": "बाड़मेर",
  "Beawar": "ब्यावर",
  "Bharatpur": "भरतपुर",
  "Bhilwara": "भीलवाड़ा",
  "Bikaner": "बीकानेर",
  "Bundi": "बूंदी",
  "Chittorgarh": "चित्तौड़गढ़",
  "Churu": "चूरू",
  "Dausa": "दौसा",
  "Deeg": "दीग",
  "Dholpur": "धौलपुर",
  "Didwana-Kuchaman": "दीदवाना-कुचामन",
  "Dungarpur": "डूंगरपुर",
  "Ganganagar": "गंगानगर",
  "Hanumangarh": "हनुमानगढ़",
  "Jaipur": "जयपुर",
  "Jaisalmer": "जैसलमेर",
  "Jalore": "जालोर",
  "Jhalawar": "झालावाड़",
  "Jhunjhunu": "झुंझुनू",
  "Jodhpur": "जोधपुर",
  "Karauli": "करणौली",
  "Kota": "कोटा",
  "Nagaur": "नागौर",
  "Pali": "पाली",
  "Pratapgarh": "प्रतापगढ़",
  "Rajsamand": "राजसमंद",
  "Sawai Madhopur": "सवाई माधोपुर",
  "Sikar": "सीकर",
  "Sirohi": "सिरोही",
  "Tonk": "टोंक",
  "Udaipur": "उदयपुर",

  // Additional common districts that might be used
  "Delhi": "दिल्ली",
  "Mumbai": "मुम्बई",
  "Kolkata": "कोलकाता",
  "Chennai": "चेन्नई",
  "Bangalore": "बैंगलोर",
  "Hyderabad": "हैदराबाद",
  "Pune": "पुणे",
  "Ahmedabad": "अहमदाबाद",
  "Surat": "सूरत",
  "Lucknow": "लखनऊ",
  "Kanpur": "कानपुर",
  "Nagpur": "नागपुर",
  "Indore": "इंदौर",
  "Bhopal": "भोपाल",
  "Patna": "पटना",
  "Ranchi": "रांची",
  "Guwahati": "गुवाहाटी",
  "Bhubaneswar": "भुवनेश्वर",
  "Chandigarh": "चंडीगढ़",

  // Add more districts as needed
  // You can expand this mapping for other states
}

/**
 * Convert English district name to Hindi
 * @param englishDistrict - The district name in English
 * @returns The district name in Hindi (Devanagari script), or the original name if not found
 */
export function getDistrictInHindi(englishDistrict: string): string {
  return DISTRICT_HINDI_MAPPING[englishDistrict] || englishDistrict
}
