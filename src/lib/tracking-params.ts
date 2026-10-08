// Query parameters that only exist to attribute clicks to campaigns, ads,
// newsletters or the person who shared a link. Names are matched
// case-insensitively after percent-decoding.
//
// Keep in sync with Pleroma.Web.ActivityPub.MRF.StripTrackingParamsPolicy in
// darqoma, which strips the same parameters from posts on the server.

const GLOBAL_PARAMS = new Set([
  // Google Ads / Analytics / Shopping
  "gclid",
  "gclsrc",
  "dclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "gad_campaignid",
  "srsltid",
  "_ga",
  "_gl",
  "utm",
  // Ad and social click ids
  "fbclid",
  "mibextid",
  "sfnsn",
  "fb_action_ids",
  "fb_action_types",
  "fb_ref",
  "fb_source",
  "action_object_map",
  "action_type_map",
  "action_ref_map",
  "igshid",
  "igsh",
  "msclkid",
  "twclid",
  "ttclid",
  "li_fat_id",
  "epik",
  "sccid",
  "rdt_cid",
  "yclid",
  "ysclid",
  "_openstat",
  "irclickid",
  "irgwc",
  "obclid",
  "dicbo",
  "tblci",
  "wickedid",
  "rb_clickid",
  // Newsletter and marketing automation
  "mc_cid",
  "mc_eid",
  "mc_tc",
  "_hsenc",
  "_hsmi",
  "__hstc",
  "__hssc",
  "__hsfp",
  "hsctatracking",
  "mkt_tok",
  "oly_anon_id",
  "oly_enc_id",
  "vero_id",
  "vero_conv",
  "__s",
  "_kx",
  "ml_subscriber",
  "ml_subscriber_hash",
  "ck_subscriber_id",
  // Adobe, Matomo, AT Internet, Webtrekk, comScore and friends
  "s_cid",
  "s_kwcid",
  "ef_id",
  "pk_campaign",
  "pk_kwd",
  "pk_keyword",
  "pk_source",
  "pk_medium",
  "pk_content",
  "pk_cid",
  "xtor",
  "wt_mc",
  "wt_zmc",
  "wtmc",
  "wtrid",
  "ns_campaign",
  "ns_mchannel",
  "ns_source",
  "ns_linkname",
  "ns_fee",
  "cmpid",
  "echobox",
  "spm",
])

const GLOBAL_PREFIXES = [
  "utm_", // Google Analytics campaigns
  "at_", // AT Internet / Piano Analytics (at_medium, at_campaign, ...)
  "mtm_", // Matomo
  "piwik_",
  "matomo_",
  "hsa_", // HubSpot ads
  "ga_",
  "itm_",
  "hmb_",
  "bsft_", // Blueshift
  "_branch_", // Branch.io deep links
  "wt.", // Webtrends (WT.mc_id, ...)
]

interface SiteRule {
  // "example.com" also covers subdomains; "example.*" covers any TLD.
  domains: string[]
  params: string[]
  prefixes?: string[]
}

const SITE_RULES: SiteRule[] = [
  {
    domains: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
    params: [
      "si",
      "feature",
      "pp",
      "embeds_referring_euri",
      "embeds_referring_origin",
      "source_ve_path",
    ],
  },
  { domains: ["spotify.com"], params: ["si", "nd", "dlsi"] },
  {
    domains: ["twitter.com", "x.com"],
    params: ["s", "t", "ref_src", "ref_url"],
  },
  {
    domains: ["facebook.com", "fb.com", "fb.watch"],
    params: [
      "__tn__",
      "fref",
      "hc_ref",
      "ref",
      "refsrc",
      "rdid",
      "eav",
      "paipv",
      "comment_tracking",
      "notif_id",
      "notif_t",
    ],
    prefixes: ["__cft__", "__xts__"],
  },
  { domains: ["threads.net", "threads.com"], params: ["xmt", "slof"] },
  {
    domains: ["tiktok.com"],
    params: [
      "_d",
      "_r",
      "_t",
      "checksum",
      "enter_from",
      "is_copy_url",
      "is_from_webapp",
      "sec_user_id",
      "sender_device",
      "sender_web_id",
      "share_app_id",
      "share_author_id",
      "share_item_id",
      "share_link_id",
      "social_sharing",
      "timestamp",
      "tt_from",
      "u_code",
      "user_id",
      "web_id",
    ],
  },
  {
    domains: ["reddit.com", "redd.it"],
    params: [
      "share_id",
      "rdt",
      "ref",
      "ref_source",
      "ref_campaign",
      "correlation_id",
    ],
  },
  {
    domains: ["linkedin.com", "lnkd.in"],
    params: [
      "trk",
      "trkinfo",
      "trkemail",
      "trackingid",
      "refid",
      "lipi",
      "lici",
      "midtoken",
      "midsig",
      "eid",
      "rcm",
    ],
  },
  {
    domains: ["amazon.*"],
    params: [
      "ref",
      "ref_",
      "_encoding",
      "ascsubtag",
      "camp",
      "content-id",
      "creative",
      "creativeasin",
      "crid",
      "dchild",
      "dib",
      "dib_tag",
      "linkcode",
      "linkid",
      "qid",
      "qualifier",
      "refrid",
      "skiptwisterog",
      "social_share",
      "spia",
      "sprefix",
      "sr",
      "starsleft",
    ],
    prefixes: ["pf_rd_", "pd_rd_"],
  },
  { domains: ["imdb.com"], params: ["ref_"], prefixes: ["pf_rd_", "pd_rd_"] },
  {
    domains: ["google.*"],
    params: [
      "ved",
      "ei",
      "sxsrf",
      "sca_esv",
      "sca_upv",
      "gs_lcp",
      "gs_lp",
      "gs_ssp",
      "gs_l",
      "oq",
      "aqs",
      "uact",
      "rlz",
      "sourceid",
      "sclient",
      "bih",
      "biw",
      "dpr",
      "iflsig",
    ],
  },
  {
    domains: ["bing.com"],
    params: ["form", "cvid", "pq", "qs", "sc", "sk", "sp"],
  },
  { domains: ["msn.com"], params: ["ocid", "cvid", "pc", "ei"] },
  {
    domains: ["yahoo.com"],
    params: [
      "guccounter",
      "guce_referrer",
      "guce_referrer_sig",
      "soc_src",
      "soc_trk",
      "ncid",
      "tsrc",
      ".tsrc",
      "sr_share",
    ],
  },
  {
    domains: ["ebay.*"],
    params: [
      "_trkparms",
      "_trksid",
      "amdata",
      "campid",
      "customid",
      "mkcid",
      "mkevt",
      "mkrid",
      "toolid",
    ],
  },
  {
    domains: ["aliexpress.*"],
    params: [
      "aff_fcid",
      "aff_fsk",
      "aff_platform",
      "aff_trace_key",
      "afsmartredirect",
      "algo_expid",
      "algo_pvid",
      "btsid",
      "gatewayadapt",
      "pdp_ext_f",
      "pdp_npi",
      "pvid",
      "scm",
      "scm_id",
      "scm-url",
      "sk",
      "srcsns",
      "terminal_id",
      "ws_ab_test",
    ],
  },
  {
    domains: ["etsy.com"],
    params: [
      "click_key",
      "click_sum",
      "organic_search_click",
      "plkey",
      "rec_type",
      "ref",
    ],
  },
  {
    domains: ["nytimes.com"],
    params: [
      "smid",
      "smtyp",
      "partner",
      "emc",
      "nl",
      "campaign_id",
      "instance_id",
      "segment_id",
      "user_id",
      "regi_id",
      "te",
    ],
  },
  {
    domains: ["washingtonpost.com"],
    params: ["itid", "wpisrc", "wpmk", "pwapi_token"],
  },
  { domains: ["bloomberg.com"], params: ["srnd", "sref", "leadsource"] },
  { domains: ["forbes.com"], params: ["sh", "ss"] },
  { domains: ["theguardian.com"], params: ["cmp"] },
  { domains: ["medium.com"], params: ["source"] },
  { domains: ["substack.com"], params: ["r", "triedredirect"] },
  { domains: ["apple.com"], params: ["itscg", "itsct", "uo"] },
  { domains: ["twitch.tv"], params: ["tt_content", "tt_medium"] },
  {
    domains: ["spiegel.de", "manager-magazin.de"],
    params: [],
    prefixes: ["sara_"],
  },
  { domains: ["faz.net"], params: ["gepc"] },
  { domains: ["welt.de"], params: ["cid"] },
]

function matchesDomain(host: string, domain: string): boolean {
  if (!domain.endsWith(".*")) {
    return host === domain || host.endsWith(`.${domain}`)
  }

  // "amazon.*" matches amazon.de, www.amazon.co.uk, smile.amazon.com, ...
  // but not amazon.example.org.
  const labels = host.split(".").reverse()
  const name = domain.slice(0, -2)
  return labels[1] === name || (labels[2] === name && labels[1].length <= 3)
}

function trackingParamMatcher(host: string) {
  const rules = SITE_RULES.filter((rule) =>
    rule.domains.some((domain) => matchesDomain(host, domain))
  )

  return (name: string) =>
    GLOBAL_PARAMS.has(name) ||
    GLOBAL_PREFIXES.some((prefix) => name.startsWith(prefix)) ||
    rules.some(
      (rule) =>
        rule.params.includes(name) ||
        rule.prefixes?.some((prefix) => name.startsWith(prefix))
    )
}

function paramName(pair: string): string {
  const raw = pair.split("=", 1)[0].replace(/\+/g, " ")
  try {
    return decodeURIComponent(raw).toLowerCase()
  } catch {
    return raw.toLowerCase()
  }
}

// Removes tracking parameters from an http(s) URL. Everything else, including
// the order and encoding of the remaining parameters, is left untouched.
export function stripTrackingParams(url: string): string {
  const queryStart = url.indexOf("?")
  if (queryStart === -1) return url

  const fragmentStart = url.indexOf("#")
  if (fragmentStart !== -1 && fragmentStart < queryStart) return url

  const host = /^https?:\/\/(?:[^/?#@]*@)?([^/?#:]+)/i
    .exec(url)?.[1]
    ?.toLowerCase()
  if (!host) return url

  const queryEnd = fragmentStart === -1 ? url.length : fragmentStart
  const isTracking = trackingParamMatcher(host)
  const pairs = url.slice(queryStart + 1, queryEnd).split("&")
  const kept = pairs.filter((pair) => !isTracking(paramName(pair)))
  if (kept.length === pairs.length) return url

  const query = kept.filter((pair) => pair !== "").join("&")
  return (
    url.slice(0, queryStart) + (query ? `?${query}` : "") + url.slice(queryEnd)
  )
}

// Link text that spells out the URL is cleaned as well. Mastodon splits it
// over several spans (scheme, first 30 characters, rest), so the cleaned text
// is written back over the original text nodes at the same offsets.
function stripLinkText(anchor: HTMLAnchorElement): boolean {
  const text = anchor.textContent ?? ""
  if (!text.includes("?") || /\s/.test(text)) return false

  const hasScheme = /^https?:\/\//i.test(text)
  const cleaned = hasScheme
    ? stripTrackingParams(text)
    : stripTrackingParams(`https://${text}`).slice("https://".length)
  if (cleaned === text) return false

  const walker = anchor.ownerDocument.createTreeWalker(
    anchor,
    NodeFilter.SHOW_TEXT
  )
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  let offset = 0
  nodes.forEach((node, i) => {
    const length = node.data.length
    node.data =
      i === nodes.length - 1
        ? cleaned.slice(offset)
        : cleaned.slice(offset, offset + length)
    offset += length
  })
  return true
}

// Removes tracking parameters from every link in a post's HTML content.
export function stripTrackingFromHtml(html: string): string {
  if (!html.includes("?")) return html

  const doc = new DOMParser().parseFromString(html, "text/html")
  let changed = false

  doc.body.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href")
    if (href) {
      const cleaned = stripTrackingParams(href)
      if (cleaned !== href) {
        anchor.setAttribute("href", cleaned)
        changed = true
      }
    }
    if (stripLinkText(anchor)) changed = true
  })

  return changed ? doc.body.innerHTML : html
}
