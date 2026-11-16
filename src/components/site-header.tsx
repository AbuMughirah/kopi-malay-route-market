import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Heart, LayoutDashboard, Menu, Search, ShoppingBag, Truck, User, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import badge from "@/assets/tak-route-1-badge.png.asset.json";
import kopiLogo from "@/assets/kopi-malay-logo-v2.png.asset.json";

export const NAV = [
  { label: "Shop All", category: undefined },
  { label: "Jerseys & T-shirts", category: "jerseys-t-shirts" },
  { label: "Stickers", category: "stickers" },
  { label: "Tumblers", category: "tumblers" },
  { label: "Fridge Magnets", category: "fridge-magnets" },
  { label: "Patches", category: "patches" },
  { label: "Lanyard", category: "lanyard" },
  { label: "Other Merch", category: "other-merch" },
] as const;

function NavLink({ item, onClick, className }: { item: (typeof NAV)[number]; onClick?: () => void; className: string }) {
  return item.category ? (
    <Link to="/shop/$category" params={{ category: item.category }} className={className} onClick={onClick}>{item.label}</Link>
  ) : (
    <Link to="/shop" className={className} onClick={onClick} activeOptions={{ exact: true }}>{item.label}</Link>
  );
}

const topCls = "flex items-center gap-1 font-display text-base font-semibold uppercase tracking-wide text-foreground/85 hover:text-foreground focus:outline-none";
const itemCls = "w-full cursor-pointer font-display text-sm uppercase";

export function SiteHeader() {
  const { count, setOpen, user } = useCart();
  const { ids } = useWishlist();
  const admin = useIsAdmin();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const close = () => setMenu(false);

  return (
    <header className="no-print sticky top-0 z-40 border-b bg-background text-foreground">
      <div className="mx-auto flex h-24 max-w-7xl items-center gap-2 px-3 sm:h-28 sm:gap-4 sm:px-4">
        <button className="grid size-10 shrink-0 place-items-center lg:hidden" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
          {menu ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Kopi Malay x Route 1 home">
          <img src={kopiLogo.url} alt="Kopi Malay official logo" className="size-16 shrink-0 object-contain sm:size-20" />
          <span aria-hidden className="font-display text-xl font-bold text-foreground/70 sm:text-2xl">x</span>
          <img src={badge.url} alt="Tak Route 1 badge" className="size-16 shrink-0 object-contain sm:size-20" />
        </Link>
        <nav className="ml-6 hidden items-center gap-6 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger className={topCls}>Shop <ChevronDown className="size-4" /></DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {NAV.map((n) => <DropdownMenuItem key={n.label} asChild><NavLink item={n} className={itemCls} /></DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className={topCls}>Services <ChevronDown className="size-4" /></DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild><Link to="/towing" className={itemCls}>Towing &amp; Rescue</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/contact" className={topCls}>Contact us</Link>
          <Link to="/track" className={topCls}><Truck className="size-4" /> Track order</Link>
          {admin && <Link to="/admin" className={topCls}><LayoutDashboard className="size-4" /> Admin</Link>}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-0 sm:gap-3 [&>*]:grid [&>*]:min-h-10 [&>*]:min-w-9 sm:[&>*]:min-w-10 [&>*]:place-items-center sm:[&>*]:flex">
          <button aria-label="Search" onClick={() => setSearch(!search)}><Search className="size-6" /></button>
          <Link to="/wishlist" aria-label="Wishlist" className="relative">
            <Heart className="size-6" />
            {ids.length > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">{ids.length}</span>}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Account" title={`Signed in as ${user.email}`} className="flex items-center gap-1 text-sm">
                <User className="size-6" /><span className="hidden sm:inline">Account</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/profile">My profile</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" aria-label="Account" className="flex items-center gap-1 text-sm"><User className="size-6" /><span className="hidden sm:inline">Login</span></Link>
          )}
          <button aria-label="Open cart" className="relative" onClick={() => setOpen(true)}>
            <ShoppingBag className="size-6" />
            {count > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">{count}</span>}
          </button>
        </div>
      </div>
      {search && (
        <form className="border-t border-foreground/10 px-4 py-3" onSubmit={(e) => { e.preventDefault(); setSearch(false); navigate({ to: "/shop", search: { q: q || undefined } }); }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stickers, jerseys, tumblers…"
            className="mx-auto block w-full max-w-2xl rounded-md border border-foreground/20 bg-transparent px-4 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/40" />
        </form>
      )}
      {menu && (
        <nav className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto border-t border-foreground/10 px-4 py-4 lg:hidden">
          <p className="pb-1 font-display text-xs font-bold uppercase tracking-widest text-foreground/50">Shop</p>
          {NAV.map((n) => <NavLink key={n.label} item={n} onClick={close} className="py-1.5 pl-2 font-display text-sm uppercase text-foreground/85" />)}
          <p className="pb-1 pt-3 font-display text-xs font-bold uppercase tracking-widest text-foreground/50">Services</p>
          <Link to="/towing" onClick={close} className="py-1.5 pl-2 font-display text-sm uppercase text-foreground/85">Towing &amp; Rescue</Link>
          <Link to="/contact" onClick={close} className="mt-3 py-1.5 font-display text-sm font-bold uppercase">Contact us</Link>
          <Link to="/track" onClick={close} className="mt-3 flex items-center gap-2 py-1.5 font-display text-sm font-bold uppercase"><Truck className="size-4" /> Track my order</Link>
          {admin && <Link to="/admin" onClick={close} className="pt-3 font-display text-sm font-bold uppercase">Admin dashboard</Link>}
        </nav>
      )}
      <div className="road-stripe" />
    </header>
  );
}

export function MarqueeBanner() {
  const text = "Register To Be A Member Today To Receive Special Offer!";
  return (
    <Link to="/auth" search={{ mode: "signup" }} className="no-print block overflow-hidden bg-ink py-2 text-ink-foreground" aria-label={text}>
      <div className="flex w-max animate-marquee gap-16 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-wider">
        {Array.from({ length: 8 }).map((_, i) => <span key={i} aria-hidden={i > 0}>★ {text}</span>)}
      </div>
    </Link>
  );
}
