import dns from "dns";

dns.resolveSrv("_mongodb._tcp.cluster0.vwm0box.mongodb.net", (err, addresses) => {
  if (err) {
    console.log("❌ DNS SRV lookup failed:", err);
  } else {
    console.log("✅ SRV records:", addresses);
  }
});