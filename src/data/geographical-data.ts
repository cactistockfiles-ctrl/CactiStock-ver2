/**
 * Comprehensive geographical data with cascading hierarchy:
 * Country -> Province/State -> City/District -> District (Sub-district) -> Zipcode
 */

import { DISTRICT_LIST } from "../../district";
import { PROVINCE_LIST } from "../../province";
import { SUB_DISTRICT_LIST } from "../../subDistrict";
import { ZIPCODE_LIST } from "../../zipcode";

export interface GeographicalNode {
  label: string;
  children?: Record<string, GeographicalNode>;
  zipcodes?: string[];
}

export const THAILAND_COUNTRY = "Thailand";

const thailandProvinceByPid = new Map(PROVINCE_LIST.map((province) => [province.pid, province.v]));
const thailandDistrictsByProvince = new Map<string, string[]>();
const thailandDistrictPidByProvinceAndName = new Map<string, string>();
const thailandSubdistrictsByDistrict = new Map<string, string[]>();
const thailandSubdistrictPidByDistrictAndName = new Map<string, string>();
const thailandZipcodesBySubdistrict = new Map<string, string[]>();

for (const province of PROVINCE_LIST) {
  thailandDistrictsByProvince.set(province.v, []);
}

for (const district of DISTRICT_LIST) {
  const provinceName = thailandProvinceByPid.get(district.ppid);
  if (!provinceName) continue;

  const existingDistricts = thailandDistrictsByProvince.get(provinceName);
  if (existingDistricts) {
    existingDistricts.push(district.v);
  }

  thailandDistrictPidByProvinceAndName.set(
    `${provinceName}|||${district.v}`,
    district.pid,
  );
  thailandSubdistrictsByDistrict.set(district.pid, []);
}

for (const subdistrict of SUB_DISTRICT_LIST) {
  const existingSubdistricts = thailandSubdistrictsByDistrict.get(subdistrict.dpid);
  if (existingSubdistricts) {
    existingSubdistricts.push(subdistrict.v);
  }

  thailandSubdistrictPidByDistrictAndName.set(
    `${subdistrict.dpid}|||${subdistrict.v}`,
    subdistrict.pid,
  );
}

for (const zipcode of ZIPCODE_LIST) {
  const existingZipcodes = thailandZipcodesBySubdistrict.get(zipcode.pid) ?? [];
  existingZipcodes.push(zipcode.v);
  thailandZipcodesBySubdistrict.set(zipcode.pid, existingZipcodes);
}

export const GEOGRAPHICAL_DATA: Record<string, GeographicalNode> = {
  Thailand: {
    label: "Thailand",
  },
  "Alaska": {
    label: "Alaska",
  },
  "Hawaii": {
    label: "Hawaii",
  },
  "Puerto Rico": {
    label: "Puerto Rico",
  },
  "Canada": {
    label: "Canada",
  },
  "Europe": {
    label: "Europe",
  },
  "Russia": {
    label: "Russia",
  },
  "Singapore": {
    label: "Singapore",
  },
  "Hong Kong": {
    label: "Hong Kong",
  },
  "South Africa": {
    label: "South Africa",
  },
  "United States": {
    label: "United States",
    children: {
      "California": {
        label: "California",
        children: {
          "Los Angeles": {
            label: "Los Angeles",
            zipcodes: ["90001", "90002", "90010", "90011"],
          },
          "San Francisco": {
            label: "San Francisco",
            zipcodes: ["94102", "94103", "94104"],
          },
          "San Diego": {
            label: "San Diego",
            zipcodes: ["92101", "92102"],
          },
        },
      },
      "New York": {
        label: "New York",
        children: {
          "New York City": {
            label: "New York City",
            zipcodes: ["10001", "10002", "10003"],
          },
          "Buffalo": {
            label: "Buffalo",
            zipcodes: ["14202", "14203"],
          },
        },
      },
      "Texas": {
        label: "Texas",
        children: {
          "Houston": {
            label: "Houston",
            zipcodes: ["77001", "77002"],
          },
          "Dallas": {
            label: "Dallas",
            zipcodes: ["75201", "75202"],
          },
        },
      },
    },
  },
  "United Kingdom": {
    label: "United Kingdom",
    children: {
      "England": {
        label: "England",
        children: {
          "London": {
            label: "London",
            zipcodes: ["EC1A", "EC1B", "E1", "E2"],
          },
          "Manchester": {
            label: "Manchester",
            zipcodes: ["M1", "M2", "M3"],
          },
        },
      },
      "Scotland": {
        label: "Scotland",
        children: {
          "Glasgow": {
            label: "Glasgow",
            zipcodes: ["G1", "G2", "G3"],
          },
          "Edinburgh": {
            label: "Edinburgh",
            zipcodes: ["EH1", "EH2"],
          },
        },
      },
    },
  },
  "Japan": {
    label: "Japan",
    children: {
      "Tokyo": {
        label: "Tokyo",
        children: {
          "Shibuya": {
            label: "Shibuya",
            zipcodes: ["150-0001", "150-0002"],
          },
          "Shinjuku": {
            label: "Shinjuku",
            zipcodes: ["160-0022", "160-0023"],
          },
        },
      },
      "Osaka": {
        label: "Osaka",
        children: {
          "Chuo": {
            label: "Chuo",
            zipcodes: ["540-0001", "540-0002"],
          },
        },
      },
    },
  },
  "Australia": {
    label: "Australia",
    children: {
      "New South Wales": {
        label: "New South Wales",
        children: {
          "Sydney": {
            label: "Sydney",
            zipcodes: ["2000", "2001", "2002"],
          },
        },
      },
      "Victoria": {
        label: "Victoria",
        children: {
          "Melbourne": {
            label: "Melbourne",
            zipcodes: ["3000", "3001"],
          },
        },
      },
    },
  },
};

/**
 * Get provinces/states for a country
 */
export function getProvinces(country: string): string[] {
  if (country === THAILAND_COUNTRY) {
    return PROVINCE_LIST.map((province) => province.v);
  }

  const countryData = GEOGRAPHICAL_DATA[country];
  if (!countryData?.children) return [];
  return Object.keys(countryData.children);
}

/**
 * Get cities/districts for a country and province
 */
export function getCities(country: string, province: string): string[] {
  if (country === THAILAND_COUNTRY) {
    return thailandDistrictsByProvince.get(province) ?? [];
  }

  const countryData = GEOGRAPHICAL_DATA[country];
  const provinceData = countryData?.children?.[province];
  if (!provinceData?.children) return [];
  return Object.keys(provinceData.children);
}

/**
 * Get sub-districts for a country, province, and city
 */
export function getDistricts(
  country: string,
  province: string,
  city: string,
): string[] {
  if (country === THAILAND_COUNTRY) {
    const districtPid = thailandDistrictPidByProvinceAndName.get(
      `${province}|||${city}`,
    );
    if (!districtPid) return [];
    return thailandSubdistrictsByDistrict.get(districtPid) ?? [];
  }

  const countryData = GEOGRAPHICAL_DATA[country];
  const provinceData = countryData?.children?.[province];
  const cityData = provinceData?.children?.[city];

  if (!cityData) return [];
  if (cityData.children) {
    return Object.keys(cityData.children);
  }

  return [];
}

/**
 * Get zipcodes for a country, province, city, and optional district/subdistrict
 */
export function getZipcodes(
  country: string,
  province: string,
  city: string,
  subdistrict?: string,
): string[] {
  if (country === THAILAND_COUNTRY) {
    const districtPid = thailandDistrictPidByProvinceAndName.get(
      `${province}|||${city}`,
    );
    if (!districtPid) return [];

    if (subdistrict) {
      const subdistrictPid = thailandSubdistrictPidByDistrictAndName.get(
        `${districtPid}|||${subdistrict}`,
      );
      return subdistrictPid ? thailandZipcodesBySubdistrict.get(subdistrictPid) ?? [] : [];
    }

    const subdistricts = thailandSubdistrictsByDistrict.get(districtPid) ?? [];
    const zipcodes = new Set<string>();
    for (const sub of subdistricts) {
      const subdistrictPid = thailandSubdistrictPidByDistrictAndName.get(
        `${districtPid}|||${sub}`,
      );
      const subZips = subdistrictPid ? thailandZipcodesBySubdistrict.get(subdistrictPid) ?? [] : [];
      for (const zip of subZips) {
        zipcodes.add(zip);
      }
    }
    return Array.from(zipcodes);
  }

  const countryData = GEOGRAPHICAL_DATA[country];
  const provinceData = countryData?.children?.[province];
  const cityData = provinceData?.children?.[city];
  return cityData?.zipcodes ?? [];
}

/**
 * Get all countries
 */
export function getCountries(): string[] {
  return Object.keys(GEOGRAPHICAL_DATA);
}
