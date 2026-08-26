// Seed catalog. Mix & Match items and hero/category products use real AI-generated
// photography stored in /assets/img/real/. Other items use generated SVG art.
// palette = colour family used by Mix & Match matching; matches = palettes this item pairs well with.

const SIZES = {
  newborn: ['0-3M', '3-6M', '6-9M', '9-12M'],
  toddler: ['1Y', '2Y', '3Y'],
  kids: ['4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y']
};

const REAL = '/assets/img/real';

let seq = 0;
function P(p) {
  seq += 1;
  return Object.assign(
    {
      id: seq,
      gender: 'unisex',
      ageGroup: 'kids',
      category: 'tops',
      type: 'tshirt',
      motif: 'star',
      hex: '#9cc6ff',
      accent: '#ffffff',
      mrp: Math.round(p.price * 1.55),
      rating: 4.3,
      ratings: 120 + seq * 37,
      badge: null,
      mix: null,
      palette: 'blue',
      matches: [],
      photo: null,
      spotlight: false,
      stock: 25,
      material: '100% Organic Cotton',
      description: 'Ultra-soft premium fabric, tailored for all-day comfort and play. Pre-washed, skin-friendly dyes and reinforced stitching made to survive every adventure.'
    },
    p,
    { sizes: SIZES[p.ageGroup || 'kids'] }
  );
}

const products = [
  // ---------------- GIRLS — MIX & MATCH TOPS (real photos) ----------------
  P({ name: 'Star Glow Tee', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Baby Pink', hex: '#f7a8c4', motif: 'star', price: 699, rating: 4.7, badge: 'Bestseller', mix: 'top', palette: 'pink', matches: ['pink', 'cream', 'denim', 'sun'], photo: `${REAL}/gt-pink-tee.png`, photoCut: `${REAL}/gt-pink-tee-cut.png` }),
  P({ name: 'Lavender Ruffle Top', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Lavender', hex: '#c9b8f0', motif: 'flower', price: 799, rating: 4.6, mix: 'top', palette: 'lav', matches: ['cream', 'pink', 'denim'], photo: `${REAL}/gt-lavender-ruffle.png`, photoCut: `${REAL}/gt-lavender-ruffle-cut.png` }),
  P({ name: 'Daisy Mint Blouse', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Mint Green', hex: '#98e0c0', motif: 'flower', price: 849, rating: 4.5, badge: 'New', mix: 'top', palette: 'mint', matches: ['cream', 'denim', 'sun'], photo: `${REAL}/gt-mint-daisy.png`, photoCut: `${REAL}/gt-mint-daisy-cut.png` }),
  P({ name: 'Cream Heart Knit', gender: 'girls', category: 'tops', type: 'hoodie', color: 'Cream White', hex: '#f2e8d8', accent: '#f7a8c4', motif: 'heart', price: 999, rating: 4.8, badge: 'Premium', mix: 'top', palette: 'cream', matches: ['pink', 'denim', 'mint', 'sun'], photo: `${REAL}/gt-cream-heart.png`, photoCut: `${REAL}/gt-cream-heart-cut.png` }),

  // ---------------- GIRLS — MIX & MATCH BOTTOMS (real photos) ----------------
  P({ name: 'Blush Tutu Skirt', gender: 'girls', category: 'bottoms', type: 'skirt', color: 'Blush Pink', hex: '#f7a8c4', price: 899, rating: 4.8, badge: 'Bestseller', mix: 'bottom', palette: 'pink', matches: ['pink', 'cream', 'lav'], photo: `${REAL}/gb-pink-tutu.png`, photoCut: `${REAL}/gb-pink-tutu-cut.png` }),
  P({ name: 'Cloud White Leggings', gender: 'girls', category: 'bottoms', type: 'pants', color: 'Soft White', hex: '#f2f0ea', price: 549, rating: 4.5, mix: 'bottom', palette: 'cream', matches: ['pink', 'lav', 'mint', 'cream'], photo: `${REAL}/gb-white-leggings.png`, photoCut: `${REAL}/gb-white-leggings-cut.png` }),
  P({ name: 'Denim Button Skirt', gender: 'girls', category: 'bottoms', type: 'skirt', color: 'Light Denim', hex: '#9db8d8', price: 849, rating: 4.6, badge: 'Trending', mix: 'bottom', palette: 'denim', matches: ['pink', 'mint', 'cream', 'lav'], photo: `${REAL}/gb-denim-skirt.png`, photoCut: `${REAL}/gb-denim-skirt-cut.png` }),
  P({ name: 'Sunny Bow Shorts', gender: 'girls', category: 'bottoms', type: 'shorts', color: 'Butter Yellow', hex: '#ffd98a', price: 649, rating: 4.4, mix: 'bottom', palette: 'sun', matches: ['mint', 'cream'], photo: `${REAL}/gb-yellow-shorts.png`, photoCut: `${REAL}/gb-yellow-shorts-cut.png` }),

  // ---------------- GIRLS — MIX & MATCH TOPS (wave 2) ----------------
  P({ name: 'Coral Ruffle Tee', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Coral', hex: '#ff9e9e', price: 699, rating: 4.5, mix: 'top', palette: 'peach', matches: ['cream', 'sun', 'denim'], photo: `${REAL}/mm-gt-coral.png`, photoCut: `${REAL}/mm-gt-coral-cut.png` }),
  P({ name: 'Sunny Smile Tee', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Butter Yellow', hex: '#ffd98a', motif: 'star', price: 649, rating: 4.4, mix: 'top', palette: 'sun', matches: ['denim', 'cream', 'mint'], photo: `${REAL}/mm-gt-sun.png`, photoCut: `${REAL}/mm-gt-sun-cut.png` }),
  P({ name: 'Sky Bow Blouse', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Sky Blue', hex: '#9cc6ff', price: 849, rating: 4.6, mix: 'top', palette: 'blue', matches: ['cream', 'denim', 'sun'], photo: `${REAL}/mm-gt-skybow.png`, photoCut: `${REAL}/mm-gt-skybow-cut.png` }),
  P({ name: 'Daisy Field Tee', gender: 'girls', category: 'tops', type: 'tshirt', color: 'White Daisy', hex: '#f2f0ea', motif: 'flower', price: 699, rating: 4.6, mix: 'top', palette: 'cream', matches: ['pink', 'mint', 'lav', 'denim', 'sun'], photo: `${REAL}/mm-gt-daisywhite.png`, photoCut: `${REAL}/mm-gt-daisywhite-cut.png` }),
  P({ name: 'Rose Stripe Top', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Rose Stripe', hex: '#e8a0b4', price: 749, rating: 4.5, mix: 'top', palette: 'pink', matches: ['pink', 'cream', 'denim'], photo: `${REAL}/mm-gt-rosestripe.png`, photoCut: `${REAL}/mm-gt-rosestripe-cut.png` }),
  P({ name: 'Sage Pocket Tee', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Sage Green', hex: '#b8d4a8', price: 649, rating: 4.4, mix: 'top', palette: 'mint', matches: ['cream', 'denim', 'sun'], photo: `${REAL}/mm-gt-sage.png`, photoCut: `${REAL}/mm-gt-sage-cut.png` }),
  P({ name: 'Lilac Heart Sweatshirt', gender: 'girls', category: 'tops', type: 'hoodie', color: 'Lilac', hex: '#c9b8f0', motif: 'heart', price: 949, rating: 4.7, mix: 'top', palette: 'lav', matches: ['cream', 'pink', 'lav'], photo: `${REAL}/mm-gt-lilacheart.png`, photoCut: `${REAL}/mm-gt-lilacheart-cut.png` }),
  P({ name: 'Peach Gingham Top', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Peach Gingham', hex: '#ffb98a', price: 799, rating: 4.5, mix: 'top', palette: 'peach', matches: ['cream', 'denim', 'sun'], photo: `${REAL}/mm-gt-peachgingham.png`, photoCut: `${REAL}/mm-gt-peachgingham-cut.png` }),

  // ---------------- GIRLS — MIX & MATCH BOTTOMS (wave 2) ----------------
  P({ name: 'Lavender Tulle Skirt', gender: 'girls', category: 'bottoms', type: 'skirt', color: 'Lavender', hex: '#c9b8f0', price: 899, rating: 4.7, mix: 'bottom', palette: 'lav', matches: ['lav', 'cream', 'pink'], photo: `${REAL}/mm-gb-lavtulle.png`, photoCut: `${REAL}/mm-gb-lavtulle-cut.png` }),
  P({ name: 'Heart Print Leggings', gender: 'girls', category: 'bottoms', type: 'pants', color: 'Soft Pink Hearts', hex: '#f7a8c4', motif: 'heart', price: 599, rating: 4.5, mix: 'bottom', palette: 'pink', matches: ['pink', 'cream', 'lav'], photo: `${REAL}/mm-gb-heartleggings.png`, photoCut: `${REAL}/mm-gb-heartleggings-cut.png` }),
  P({ name: 'Mint Pleat Skirt', gender: 'girls', category: 'bottoms', type: 'skirt', color: 'Mint Green', hex: '#98e0c0', price: 799, rating: 4.5, mix: 'bottom', palette: 'mint', matches: ['mint', 'cream', 'sun'], photo: `${REAL}/mm-gb-mintpleat.png`, photoCut: `${REAL}/mm-gb-mintpleat-cut.png` }),
  P({ name: 'Cream Paperbag Shorts', gender: 'girls', category: 'bottoms', type: 'shorts', color: 'Cream', hex: '#f2e8d8', price: 699, rating: 4.5, mix: 'bottom', palette: 'cream', matches: ['pink', 'peach', 'mint', 'lav', 'sun', 'blue'], photo: `${REAL}/mm-gb-creamshorts.png`, photoCut: `${REAL}/mm-gb-creamshorts-cut.png` }),
  P({ name: 'Sky Culotte Pants', gender: 'girls', category: 'bottoms', type: 'pants', color: 'Sky Blue', hex: '#9cc6ff', price: 849, rating: 4.5, mix: 'bottom', palette: 'blue', matches: ['blue', 'cream', 'sun'], photo: `${REAL}/mm-gb-skyculotte.png`, photoCut: `${REAL}/mm-gb-skyculotte-cut.png` }),
  P({ name: 'Sunny Flare Skirt', gender: 'girls', category: 'bottoms', type: 'skirt', color: 'Butter Yellow', hex: '#ffd98a', price: 749, rating: 4.4, mix: 'bottom', palette: 'sun', matches: ['sun', 'mint', 'cream', 'peach'], photo: `${REAL}/mm-gb-sunflare.png`, photoCut: `${REAL}/mm-gb-sunflare-cut.png` }),
  P({ name: 'Blush Jogger Pants', gender: 'girls', category: 'bottoms', type: 'pants', color: 'Blush Pink', hex: '#e8a0b4', price: 799, rating: 4.5, mix: 'bottom', palette: 'pink', matches: ['pink', 'cream', 'lav'], photo: `${REAL}/mm-gb-blushjogger.png`, photoCut: `${REAL}/mm-gb-blushjogger-cut.png` }),
  P({ name: 'Powder Blue Skort', gender: 'girls', category: 'bottoms', type: 'skirt', color: 'Powder Blue', hex: '#a8c8e8', price: 849, rating: 4.6, mix: 'bottom', palette: 'blue', matches: ['pink', 'peach', 'blue', 'mint', 'cream'], photo: `${REAL}/mm-gb-eyelet.png`, photoCut: `${REAL}/mm-gb-eyelet-cut.png` }),

  // ---------------- BOYS — MIX & MATCH TOPS (real photos) ----------------
  P({ name: 'Sky Bolt Tee', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Sky Blue', hex: '#9cc6ff', motif: 'bolt', price: 649, rating: 4.7, badge: 'Bestseller', mix: 'top', palette: 'blue', matches: ['denim', 'khaki', 'grey', 'mint'], photo: `${REAL}/bt-blue-tee.png`, photoCut: `${REAL}/bt-blue-tee-cut.png` }),
  P({ name: 'Navy Stripe Shirt', gender: 'boys', category: 'tops', type: 'jacket', color: 'Navy Stripe', hex: '#5f7fb8', price: 899, rating: 4.6, mix: 'top', palette: 'blue', matches: ['denim', 'khaki', 'charcoal'], photo: `${REAL}/bt-navy-stripe.png`, photoCut: `${REAL}/bt-navy-stripe-cut.png` }),
  P({ name: 'Storm Grey Hoodie', gender: 'boys', category: 'tops', type: 'hoodie', color: 'Heather Grey', hex: '#5b6272', accent: '#e6c586', price: 1199, rating: 4.8, badge: 'New', mix: 'top', palette: 'grey', matches: ['denim', 'mint', 'charcoal', 'khaki'], photo: `${REAL}/bt-grey-hoodie.png`, photoCut: `${REAL}/bt-grey-hoodie-cut.png` }),
  P({ name: 'Bear Buddy Tee', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Sage Green', hex: '#b8d4a8', motif: 'bear', price: 699, rating: 4.5, mix: 'top', palette: 'mint', matches: ['khaki', 'denim', 'charcoal'], photo: `${REAL}/bt-sage-bear.png`, photoCut: `${REAL}/bt-sage-bear-cut.png` }),

  // ---------------- BOYS — MIX & MATCH BOTTOMS (real photos) ----------------
  P({ name: 'Soft Denim Jeans', gender: 'boys', category: 'bottoms', type: 'pants', color: 'Light Denim', hex: '#7da4d8', price: 999, rating: 4.7, badge: 'Bestseller', mix: 'bottom', palette: 'denim', matches: ['blue', 'grey', 'mint', 'cream'], photo: `${REAL}/bb-denim-jeans.png`, photoCut: `${REAL}/bb-denim-jeans-cut.png` }),
  P({ name: 'Safari Cargo Shorts', gender: 'boys', category: 'bottoms', type: 'shorts', color: 'Khaki', hex: '#d8c9a8', price: 749, rating: 4.5, mix: 'bottom', palette: 'khaki', matches: ['blue', 'mint', 'grey'], photo: `${REAL}/bb-khaki-cargo.png`, photoCut: `${REAL}/bb-khaki-cargo-cut.png` }),
  P({ name: 'Mint Cloud Joggers', gender: 'boys', category: 'bottoms', type: 'pants', color: 'Mint Green', hex: '#98e0c0', price: 799, rating: 4.5, badge: 'New', mix: 'bottom', palette: 'mint', matches: ['grey', 'blue', 'charcoal'], photo: `${REAL}/bb-mint-joggers.png`, photoCut: `${REAL}/bb-mint-joggers-cut.png` }),
  P({ name: 'Gold Stripe Trackies', gender: 'boys', category: 'bottoms', type: 'pants', color: 'Charcoal', hex: '#4d5361', accent: '#e6c586', price: 849, rating: 4.6, mix: 'bottom', palette: 'charcoal', matches: ['blue', 'grey', 'mint'], photo: `${REAL}/bb-charcoal-track.png`, photoCut: `${REAL}/bb-charcoal-track-cut.png` }),

  // ---------------- BOYS — MIX & MATCH TOPS (wave 2) ----------------
  P({ name: 'Fox Trail Tee', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Rust Orange', hex: '#e0854a', price: 699, rating: 4.5, mix: 'top', palette: 'sun', matches: ['khaki', 'denim', 'charcoal'], photo: `${REAL}/mm-bt-fox.png`, photoCut: `${REAL}/mm-bt-fox-cut.png` }),
  P({ name: 'Forest Polo', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Forest Green', hex: '#6a9e6a', price: 799, rating: 4.5, mix: 'top', palette: 'mint', matches: ['khaki', 'cream', 'denim'], photo: `${REAL}/mm-bt-forestpolo.png`, photoCut: `${REAL}/mm-bt-forestpolo-cut.png` }),
  P({ name: 'Sailboat Tee', gender: 'boys', category: 'tops', type: 'tshirt', color: 'White', hex: '#f2f0ea', price: 649, rating: 4.5, mix: 'top', palette: 'cream', matches: ['blue', 'denim', 'khaki', 'charcoal'], photo: `${REAL}/mm-bt-sailboat.png`, photoCut: `${REAL}/mm-bt-sailboat-cut.png` }),
  P({ name: 'Navy Zip Hoodie', gender: 'boys', category: 'tops', type: 'hoodie', color: 'Navy', hex: '#5f7fb8', price: 1099, rating: 4.7, mix: 'top', palette: 'blue', matches: ['grey', 'denim', 'khaki', 'charcoal'], photo: `${REAL}/mm-bt-navyhoodie.png`, photoCut: `${REAL}/mm-bt-navyhoodie-cut.png` }),
  P({ name: 'Sunny Raglan Tee', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Yellow & White', hex: '#ffd98a', price: 649, rating: 4.4, mix: 'top', palette: 'sun', matches: ['denim', 'blue', 'grey'], photo: `${REAL}/mm-bt-raglan.png`, photoCut: `${REAL}/mm-bt-raglan-cut.png` }),
  P({ name: 'Dino Roar Tee', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Teal', hex: '#5ab8b0', price: 699, rating: 4.6, mix: 'top', palette: 'mint', matches: ['grey', 'denim', 'khaki'], photo: `${REAL}/mm-bt-dino.png`, photoCut: `${REAL}/mm-bt-dino-cut.png` }),
  P({ name: 'Grey Stripe Longsleeve', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Grey Stripe', hex: '#9aa1ad', price: 749, rating: 4.5, mix: 'top', palette: 'grey', matches: ['denim', 'charcoal', 'blue'], photo: `${REAL}/mm-bt-greystripe.png`, photoCut: `${REAL}/mm-bt-greystripe-cut.png` }),
  P({ name: 'Oxford Sky Shirt', gender: 'boys', category: 'tops', type: 'jacket', color: 'Light Blue', hex: '#a8c8e8', price: 899, rating: 4.6, mix: 'top', palette: 'blue', matches: ['khaki', 'denim', 'cream', 'charcoal'], photo: `${REAL}/mm-bt-oxford.png`, photoCut: `${REAL}/mm-bt-oxford-cut.png` }),

  // ---------------- BOYS — MIX & MATCH BOTTOMS (wave 2) ----------------
  P({ name: 'Navy Chino Shorts', gender: 'boys', category: 'bottoms', type: 'shorts', color: 'Navy', hex: '#5f7fb8', price: 699, rating: 4.5, mix: 'bottom', palette: 'blue', matches: ['blue', 'cream', 'sun', 'grey'], photo: `${REAL}/mm-bb-navychino.png`, photoCut: `${REAL}/mm-bb-navychino-cut.png` }),
  P({ name: 'Grey Cargo Pants', gender: 'boys', category: 'bottoms', type: 'pants', color: 'Grey', hex: '#8a919e', price: 849, rating: 4.5, mix: 'bottom', palette: 'grey', matches: ['blue', 'mint', 'sun', 'cream'], photo: `${REAL}/mm-bb-greycargo.png`, photoCut: `${REAL}/mm-bb-greycargo-cut.png` }),
  P({ name: 'Beige Linen Pants', gender: 'boys', category: 'bottoms', type: 'pants', color: 'Beige', hex: '#d8c9a8', price: 899, rating: 4.6, mix: 'bottom', palette: 'khaki', matches: ['blue', 'mint', 'cream', 'sun'], photo: `${REAL}/mm-bb-beigelinen.png`, photoCut: `${REAL}/mm-bb-beigelinen-cut.png` }),
  P({ name: 'Olive Jogger Pants', gender: 'boys', category: 'bottoms', type: 'pants', color: 'Olive', hex: '#8a9662', price: 799, rating: 4.5, mix: 'bottom', palette: 'khaki', matches: ['sun', 'cream', 'grey', 'mint'], photo: `${REAL}/mm-bb-olivejogger.png`, photoCut: `${REAL}/mm-bb-olivejogger-cut.png` }),
  P({ name: 'Plaid Play Shorts', gender: 'boys', category: 'bottoms', type: 'shorts', color: 'Blue Plaid', hex: '#7da4d8', price: 649, rating: 4.4, mix: 'bottom', palette: 'blue', matches: ['blue', 'cream', 'grey'], photo: `${REAL}/mm-bb-plaidshorts.png`, photoCut: `${REAL}/mm-bb-plaidshorts-cut.png` }),
  P({ name: 'Cord Brown Pants', gender: 'boys', category: 'bottoms', type: 'pants', color: 'Brown Cord', hex: '#a2764e', price: 899, rating: 4.5, mix: 'bottom', palette: 'khaki', matches: ['cream', 'mint', 'sun'], photo: `${REAL}/mm-bb-browncord.png`, photoCut: `${REAL}/mm-bb-browncord-cut.png` }),
  P({ name: 'Cloud White Shorts', gender: 'boys', category: 'bottoms', type: 'shorts', color: 'White', hex: '#f2f0ea', price: 599, rating: 4.4, mix: 'bottom', palette: 'cream', matches: ['blue', 'mint', 'sun', 'grey', 'khaki'], photo: `${REAL}/mm-bb-whiteshorts.png`, photoCut: `${REAL}/mm-bb-whiteshorts-cut.png` }),
  P({ name: 'Gold Line Track Shorts', gender: 'boys', category: 'bottoms', type: 'shorts', color: 'Charcoal', hex: '#4d5361', accent: '#e6c586', price: 649, rating: 4.5, mix: 'bottom', palette: 'charcoal', matches: ['blue', 'grey', 'mint', 'sun'], photo: `${REAL}/mm-bb-blacktrack.png`, photoCut: `${REAL}/mm-bb-blacktrack-cut.png` }),

  // ---------------- EDITORIAL COLLECTION (real photos) ----------------
  P({ name: 'Rosewater Twirl Dress', gender: 'girls', category: 'partywear', type: 'dress', color: 'Blush Pink', hex: '#f7a8c4', accent: '#e6c586', price: 1899, rating: 4.9, badge: 'Premium', photo: `${REAL}/girl-twirl.png`, description: 'A dreamy blush-pink tulle party dress made for twirling. Layered soft tulle, satin lining and a touch of shimmer — the dress every celebration deserves.' }),
  P({ name: 'Lavender Runway Frock', gender: 'girls', category: 'dresses', type: 'dress', color: 'Lavender', hex: '#c9b8f0', accent: '#e6c586', price: 1799, rating: 4.8, badge: 'Premium', photo: `${REAL}/girl-frock.png`, description: 'Flowing lavender chiffon with delicate gold embroidery. Light as air, elegant as can be.' }),
  P({ name: 'Beige Knit Walk Set', gender: 'boys', category: 'winter', type: 'hoodie', color: 'Warm Beige', hex: '#c9ab8e', price: 1499, rating: 4.7, badge: 'Trending', photo: `${REAL}/boy-walk.png`, description: 'A soft beige knit sweater paired with tailored charcoal trousers — smart, warm and endlessly comfortable.' }),
  P({ name: 'Little Bear Knit Romper', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'Cream White', hex: '#f2e8d8', accent: '#c9a86a', motif: 'bear', price: 899, rating: 4.9, badge: 'Bestseller', photo: `${REAL}/baby-romper.png`, description: 'Cable-knit organic cotton romper with tiny wooden buttons. Gentle on newborn skin, made for cuddles.' }),
  P({ name: 'Minty Polka Twirl Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Mint Green', hex: '#98e0c0', price: 1099, rating: 4.7, badge: 'Trending', photo: `${REAL}/toddler-jump.png`, description: 'Mint cotton with playful white polka dots — made for jumping, running and giggling.' }),
  P({ name: 'Royal Party Duo Set', gender: 'unisex', category: 'partywear', type: 'jacket', color: 'Navy Velvet', hex: '#8a6a9e', accent: '#e6c586', motif: 'crown', price: 2199, rating: 4.9, badge: 'Premium', photo: `${REAL}/party-pair.png`, description: 'Navy velvet blazer with bow tie, and an ivory dress with gold sash — the celebration set for special days.' }),
  P({ name: 'Arctic Puffer Jacket', gender: 'unisex', category: 'winter', type: 'jacket', color: 'Ice Blue', hex: '#a8c8e8', accent: '#e6c586', price: 2299, rating: 4.8, badge: 'Premium', photo: `${REAL}/winter-puffer.png`, description: 'Ice-blue puffer with cosy faux-fur hood. Warmth rated for the chilliest adventures.' }),
  P({ name: 'Dreamy Stripe PJ Set', gender: 'unisex', category: 'nightwear', type: 'tshirt', color: 'Lavender Stripe', hex: '#c9b8f0', price: 999, rating: 4.6, photo: `${REAL}/night-pjs.png`, description: 'Buttery-soft lavender-and-cream striped pajamas for storybook nights and slow mornings.' }),
  P({ name: 'Smart School Set', gender: 'unisex', category: 'school', type: 'tshirt', color: 'Navy & White', hex: '#e8edf5', accent: '#5f7fb8', price: 1299, rating: 4.5, photo: `${REAL}/school-walk.png`, description: 'Crisp polo and smart bottoms that stay neat from first bell to last. Easy-iron, tough-wearing fabric.' }),

  // ---------------- NEW DROP — homepage model wall (real photos, in stock) ----------------
  P({ name: 'Cherry Pop Tee', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Cream Cherry Print', hex: '#f2e8d8', accent: '#e05c5c', motif: 'heart', price: 749, rating: 4.7, badge: 'New Drop', spotlight: true, stock: 32, photo: `${REAL}/sec-cherry.png`, description: 'Cream organic-cotton tee covered in a playful multicolour cherry print with flutter sleeves. Soft, breezy and made for everyday adventures.' }),
  P({ name: 'Berry Sweet Sundress', gender: 'girls', category: 'dresses', type: 'dress', color: 'Soft Pink', hex: '#f7a8c4', accent: '#e05c5c', motif: 'heart', price: 1199, rating: 4.8, badge: 'New Drop', spotlight: true, stock: 24, photo: `${REAL}/sec-strawberry.png`, description: 'A breezy pink sleeveless sundress with a hand-drawn strawberry motif. Lined, light and twirl-approved.' }),
  P({ name: 'Bear Hug Tee', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Bright Blue', hex: '#5a9cf0', accent: '#ffd98a', motif: 'bear', price: 699, rating: 4.7, badge: 'New Drop', spotlight: true, stock: 40, photo: `${REAL}/sec-bear.png`, description: 'Bold blue tee with our signature bear graphic. Pairs perfectly with the bunny-ears cap (his idea, not ours).' }),
  P({ name: 'Sunny Stripe Polo', gender: 'boys', category: 'tops', type: 'tshirt', color: 'Butter Yellow Stripe', hex: '#ffd98a', accent: '#ffffff', motif: 'star', price: 849, rating: 4.6, badge: 'New Drop', spotlight: true, stock: 28, photo: `${REAL}/sec-polo.png`, description: 'Butter-yellow striped piqué polo with a soft collar — smart enough for lunch out, comfy enough for the playground.' }),
  P({ name: 'Daisy Twirl Set', gender: 'girls', category: 'dresses', type: 'dress', color: 'Mint Daisy', hex: '#98e0c0', accent: '#ffffff', motif: 'flower', price: 1299, rating: 4.8, badge: 'New Drop', spotlight: true, stock: 20, photo: `${REAL}/sec-daisy.png`, description: 'Two-piece set: mint ruffle-sleeve daisy top with a white pleated skirt. Sold together, worn on repeat.' }),
  P({ name: 'Picnic Check Shirt', gender: 'boys', category: 'tops', type: 'jacket', color: 'Red Gingham', hex: '#e05c5c', accent: '#ffffff', motif: 'star', price: 899, rating: 4.6, badge: 'New Drop', spotlight: true, stock: 26, photo: `${REAL}/sec-gingham.png`, description: 'Classic red gingham short-sleeve shirt in crisp cotton poplin. Picnic-ready, photo-ready.' }),
  P({ name: 'Rainbow Buddy Sweatshirt', gender: 'unisex', category: 'tops', type: 'hoodie', color: 'Cream Rainbow', hex: '#f2e8d8', accent: '#e6c586', motif: 'rainbow', price: 999, rating: 4.9, badge: 'New Drop', spotlight: true, stock: 36, photo: `${REAL}/sec-rainbow.png`, description: 'Matching cream sweatshirt with a little rainbow on the chest — for siblings, best friends and twin energy.' }),

  // ---------------- MORE STYLES (illustrated art) ----------------
  P({ name: 'Peach Cloud Hoodie', gender: 'girls', category: 'winter', type: 'hoodie', color: 'Warm Peach', hex: '#ffb98a', accent: '#fff1e2', motif: 'cloud', price: 1149, rating: 4.6 }),
  P({ name: 'Coral Crown Tee', gender: 'girls', category: 'tops', type: 'tshirt', color: 'Coral', hex: '#ff9e9e', accent: '#fff4e6', motif: 'crown', price: 699, rating: 4.5 }),
  P({ name: 'Rose Jogger Pants', gender: 'girls', category: 'bottoms', type: 'pants', color: 'Dusty Rose', hex: '#e8a0b4', accent: '#ffe8f0', price: 899, rating: 4.4 }),
  P({ name: 'Golden Hour Dress', gender: 'girls', category: 'partywear', type: 'dress', color: 'Butter Yellow', hex: '#ffd98a', accent: '#e07a9a', motif: 'crown', price: 1699, rating: 4.7 }),
  P({ name: 'Cloud Nine Romper', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'Pastel Blue', hex: '#9cc6ff', motif: 'cloud', price: 749, rating: 4.8 }),
  P({ name: 'Pink Petal Romper', gender: 'girls', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'Baby Pink', hex: '#f7a8c4', motif: 'heart', price: 749, rating: 4.7, badge: 'New' }),
  P({ name: 'Tiny Explorer Tee', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Sage Green', hex: '#b8d4a8', accent: '#5a6e4e', motif: 'bear', price: 549, rating: 4.5 }),
  P({ name: 'Cocoa Snug Hoodie', gender: 'unisex', category: 'winter', type: 'hoodie', color: 'Warm Taupe', hex: '#c9ab8e', accent: '#fff1e2', motif: 'bear', price: 1249, rating: 4.6 }),
  P({ name: 'Starry Night Tee', gender: 'unisex', category: 'nightwear', type: 'tshirt', color: 'Midnight Blue', hex: '#6b7fae', accent: '#ffd98a', motif: 'star', price: 699, rating: 4.5 }),
  P({ name: 'School Smart Pants', gender: 'unisex', category: 'school', type: 'pants', color: 'Charcoal', hex: '#4d5361', accent: '#b8c0d0', price: 749, rating: 4.4 }),
  // ---------------- MUST-HAVE PICKS — GIRLS, UNDER 4 (1–3Y) ----------------
  P({ name: 'Yellow and White Cotton Printed', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'White', hex: '#f2f0ea', motif: 'star', price: 399, photo: `${REAL}/mk-75.png` }),
  P({ name: 'Pink Cotton Cat and Floral', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Pink', hex: '#f7a8c4', motif: 'heart', price: 399, photo: `${REAL}/mk-76.png` }),
  P({ name: 'Peach Cotton Circus Printed Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Peach', hex: '#ffb98a', motif: 'flower', price: 399, photo: `${REAL}/mk-77.png` }),
  P({ name: 'White Cotton Dress and Bloomers', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'White', hex: '#f2f0ea', motif: 'star', price: 399, photo: `${REAL}/mk-78.png` }),
  P({ name: 'Pink and White Cotton Striped', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'White', hex: '#f2f0ea', motif: 'star', price: 399, photo: `${REAL}/mk-79.png` }),
  P({ name: 'Rainbow Print Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'White', hex: '#f2f0ea', motif: 'star', price: 404, photo: `${REAL}/mk-80.png` }),
  P({ name: 'Polka Dot Tulle Party Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Pink', hex: '#f7a8c4', motif: 'heart', price: 404, photo: `${REAL}/mk-81.png` }),
  P({ name: 'Embroidered Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Peach', hex: '#ffb98a', motif: 'flower', price: 420, photo: `${REAL}/mk-82.png` }),
  P({ name: 'Ice Cream Print Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'White', hex: '#f2f0ea', motif: 'star', price: 420, photo: `${REAL}/mk-83.png` }),
  P({ name: 'Alphabet Applique Embroidered Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Red', hex: '#e8736a', motif: 'heart', price: 420, photo: `${REAL}/mk-84.png` }),
  P({ name: 'Cotton Color block Long Sleeve', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Grey', hex: '#c4c8cf', motif: 'bolt', price: 699, photo: `${REAL}/mk-85.png` }),
  P({ name: 'Multicolor Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 449, photo: `${REAL}/mk-86.png` }),
  P({ name: 'Yellow Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Yellow', hex: '#ffd98a', motif: 'star', price: 449, photo: `${REAL}/mk-87.png` }),
  P({ name: 'Pink Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Pink', hex: '#f7a8c4', motif: 'heart', price: 449, photo: `${REAL}/mk-88.png` }),
  P({ name: 'Green Dress', gender: 'girls', ageGroup: 'toddler', category: 'dresses', type: 'dress', color: 'Green', hex: '#b8d4a8', motif: 'bear', price: 449, photo: `${REAL}/mk-89.png` }),

  // ---------------- MUST-HAVE PICKS — BOYS, UNDER 4 (1–3Y) ----------------
  P({ name: 'Green T-Shirt', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Green', hex: '#b8d4a8', motif: 'bear', price: 299, photo: `${REAL}/mk-90.png` }),
  P({ name: 'Brown Shirt', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Brown', hex: '#a2764e', motif: 'bear', price: 314, photo: `${REAL}/mk-91.png` }),
  P({ name: 'Navy Top And Bottom', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Navy', hex: '#5f7fb8', motif: 'cloud', price: 674, photo: `${REAL}/mk-92.png` }),
  P({ name: 'White T-Shirt', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'White', hex: '#f2f0ea', motif: 'star', price: 299, photo: `${REAL}/mk-93.png` }),
  P({ name: 'Blue Jogger', gender: 'boys', ageGroup: 'toddler', category: 'bottoms', type: 'pants', color: 'Blue', hex: '#9cc6ff', motif: 'cloud', price: 299, photo: `${REAL}/mk-94.png` }),
  P({ name: 'Cotton Printed T-Shirt', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Blue', hex: '#9cc6ff', motif: 'cloud', price: 299, photo: `${REAL}/mk-95.png` }),
  P({ name: 'Orange Shorts', gender: 'boys', ageGroup: 'toddler', category: 'bottoms', type: 'shorts', color: 'Orange', hex: '#d97e5a', motif: 'bolt', price: 299, photo: `${REAL}/mk-96.png` }),
  P({ name: 'Cotton Fish Design Sleeveless T-Shirt', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'White', hex: '#f2f0ea', motif: 'star', price: 299, photo: `${REAL}/mk-97.png` }),
  P({ name: 'Blue Top And Bottom', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Blue', hex: '#9cc6ff', motif: 'cloud', price: 399, photo: `${REAL}/mk-98.png` }),
  P({ name: 'Blue And Grey Top And', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Blue', hex: '#9cc6ff', motif: 'cloud', price: 399, photo: `${REAL}/mk-99.png` }),
  P({ name: 'Multicolor Top And Bottom', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-100.png` }),
  P({ name: 'Green Top And Bottom', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Green', hex: '#b8d4a8', motif: 'bear', price: 399, photo: `${REAL}/mk-101.png` }),
  P({ name: 'cotton typographic printed T-Shirt', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'White', hex: '#f2f0ea', motif: 'star', price: 399, photo: `${REAL}/mk-102.png` }),
  P({ name: 'Cotton Animal printed T-Shirt', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Cream', hex: '#f2e8d8', motif: 'bear', price: 399, photo: `${REAL}/mk-103.png` }),
  P({ name: 'Cotton Typographic printed Long Sleeve', gender: 'boys', ageGroup: 'toddler', category: 'tops', type: 'tshirt', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-104.png` }),

  // ---------------- MUST-HAVE PICKS — NEWBORN (0–12 M) ----------------
  P({ name: 'Multi Bodysuit and Knit Bottom', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 319, photo: `${REAL}/mk-105.png` }),
  P({ name: 'Multi Shorts', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'shorts', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 319, photo: `${REAL}/mk-106.png` }),
  P({ name: 'White Bodysuit and Knit Bottom', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'White', hex: '#f2f0ea', motif: 'star', price: 359, photo: `${REAL}/mk-107.png` }),
  P({ name: 'knit bodysuit and skirt', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'Green', hex: '#b8d4a8', motif: 'bear', price: 359, photo: `${REAL}/mk-108.png` }),
  P({ name: 'Multi Knit Bottom', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'pants', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-109.png` }),
  P({ name: 'Multi Knit Top', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'tshirt', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-110.png` }),
  P({ name: 'Multi Legging', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'pants', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-111.png` }),
  P({ name: 'Multicolor Front Open Vest', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 299, photo: `${REAL}/mk-112.png` }),
  P({ name: 'Multicolor Shorts', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'shorts', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 319, photo: `${REAL}/mk-113.png` }),
  P({ name: 'Multicolor Body Suit', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-114.png` }),
  P({ name: 'Multicolor Romper', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'romper', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 449, photo: `${REAL}/mk-115.png` }),
  P({ name: 'Multicolor Knit Bottom', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'pants', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-116.png` }),
  P({ name: 'Multicolor Legging', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'pants', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-117.png` }),
  P({ name: 'Multicolor Knit Top', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'tshirt', color: 'Multi', hex: '#f7a8c4', motif: 'rainbow', price: 399, photo: `${REAL}/mk-118.png` }),
  P({ name: 'Aqua Blue Orange and White', gender: 'unisex', ageGroup: 'newborn', category: 'newborn', type: 'pants', color: 'White', hex: '#f2f0ea', motif: 'star', price: 399, photo: `${REAL}/mk-119.png` })
];

const categories = [
  { key: 'boys', label: 'Boys', query: 'gender=boys', type: 'tshirt', hex: '#9cc6ff', accent: '#eaf3ff', motif: 'bolt', photo: `${REAL}/boy-walk.png` },
  { key: 'girls', label: 'Girls', query: 'gender=girls', type: 'dress', hex: '#f7a8c4', accent: '#e6c586', motif: 'flower', photo: `${REAL}/girl-frock.png` },
  { key: 'newborn', label: 'Newborn', query: 'age=newborn', type: 'romper', hex: '#f2e8d8', accent: '#c9a86a', motif: 'bear', photo: `${REAL}/baby-romper.png` },
  { key: 'toddlers', label: 'Toddlers', query: 'age=toddler', type: 'hoodie', hex: '#98e0c0', accent: '#ffffff', motif: 'cloud', photo: `${REAL}/toddler-jump.png` },
  { key: 'partywear', label: 'Party Wear', query: 'category=partywear', type: 'dress', hex: '#c9b8f0', accent: '#e6c586', motif: 'crown', photo: `${REAL}/party-pair.png` },
  { key: 'winter', label: 'Winter', query: 'category=winter', type: 'jacket', hex: '#a8c8e8', accent: '#e6c586', motif: 'star', photo: `${REAL}/winter-puffer.png` },
  { key: 'nightwear', label: 'Night Wear', query: 'category=nightwear', type: 'pants', hex: '#6b7fae', accent: '#ffd98a', motif: 'star', photo: `${REAL}/night-pjs.png` },
  { key: 'school', label: 'School', query: 'category=school', type: 'tshirt', hex: '#e8edf5', accent: '#5f7fb8', motif: 'crown', photo: `${REAL}/school-walk.png` }
];

const ages = [
  { key: 'newborn', label: 'Newborn', sub: '0–12 Months', chips: ['0-3M', '3-6M', '6-9M', '9-12M'] },
  { key: 'toddler', label: 'Toddlers', sub: '1–3 Years', chips: ['1Y', '2Y', '3Y'] },
  { key: 'kids', label: 'Kids', sub: '4–12 Years', chips: ['4Y', '5Y', '6Y', '7Y', '8Y', '10Y', '12Y'] }
];

module.exports = { products, categories, ages };
