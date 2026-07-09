import mtnIcon from "../assets/icons/mtn.svg";
import gloIcon from "../assets/icons/glo.png";
import airtelIcon from "../assets/icons/airtel-logo1.png";
import nineMobileIcon from "../assets/icons/9mobile.png";

export interface Network {
  id: string;
  name: string;
  icon: string;
  prefixes: string[];
}

export const AIRTIME_NETWORKS: Network[] = [
  {
    id: "mtn",
    name: "MTN",
    icon: mtnIcon,
    prefixes: [
      "0803", "0806", "0703", "0706",
      "0813", "0816", "0810", "0814",
      "0903", "0906", "0913", "0916",
    ],
  },
  {
    id: "airtel",
    name: "Airtel",
    icon: airtelIcon,
    prefixes: [
      "0802", "0808", "0708", "0812",
      "0701", "0902", "0907", "0901", "0912",
    ],
  },
  {
    id: "glo",
    name: "Glo",
    icon: gloIcon,
    prefixes: ["0805", "0807", "0705", "0815", "0811", "0905"],
  },
  {
    id: "9mobile",
    name: "9mobile",
    icon: nineMobileIcon,
    prefixes: ["0809", "0817", "0818", "0909", "0908"],
  },
];

export const detectNetwork = (phoneNumber: string, networks: Network[]): string | null => {
  if (phoneNumber.length < 4) return null;
  const prefix = phoneNumber.substring(0, 4);
  const network = networks.find((n) => n.prefixes.includes(prefix));
  return network?.id ?? null;
};
