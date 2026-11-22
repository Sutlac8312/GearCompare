# GearCompare

Gitar, amfi ve efekt pedalları için fiyat karşılaştırma arayüzü. HTML, CSS ve JavaScript ile çalışır.

## Yerel önizleme

Proje klasöründe şu komutu çalıştırıp tarayıcıdan [http://127.0.0.1:8000](http://127.0.0.1:8000) adresini aç.

```sh
python3 preview.py
```

Altı kategoride arama yapabilir, marka filtresi uygulayabilir ve iki ürünü karşılaştırabilirsin. Ürün detayında teknik özellikler ve üretici bağlantısının yanında her mağazanın fiyat geçmişi yer alır.

Fiyat alarmını denemek için örnek bir e-posta ile demo hesabı oluştur ve bir ürünün en düşük teklifinin altında bir hedef belirle. Alt menüdeki **Yönetici paneli** üzerinden tekliflerden birini hedef fiyata veya altına çek. Yeni fiyatı **Ürün detayı**, bildirimi **Hesabım → Bildirimler** ekranında görebilirsin.

Mağazalar, fiyatlar ve fiyat geçmişi örnek veridir. Ürün fotoğrafları temsilidir. Demo kayıtları tarayıcıda saklanır.

## MySQL kataloğu

1. DBeaver’da `gearcompare_v2` boşsa [katalog şemasını](output/sql/gearcompare_catalog_mysql.sql) çalıştır. Sekiz katalog tablosu zaten hazırsa bu adımı geç. Ardından [fiyat ve hesap tabloları migration’ını](output/sql/gearcompare_pricing_accounts_mysql.sql) çalıştır. İlk deneme için [örnek gitarı](output/sql/gearcompare_catalog_seed_mysql.sql) ekleyebilirsin.
2. Java 17 veya üzeri ve Maven bulunan bir terminalde bağlantı bilgilerini ayarla. Varsayılan MySQL adresi `127.0.0.1:3306/gearcompare_v2`. DBeaver bağlantın farklı bir sunucu veya port kullanıyorsa `DB_URL` değişkenini `jdbc:mysql://SUNUCU:PORT/gearcompare_v2` biçiminde ayarla.

```zsh
read 'DB_USER?MySQL kullanıcı adı: '
read -rs 'DB_PASSWORD?MySQL parolası: '
export DB_USER DB_PASSWORD
mvn -f backend/pom.xml spring-boot:run
```

[Siteyi aç](http://127.0.0.1:8080). Katalog ve teknik karşılaştırma, MySQL’deki ürünleri kullanır. API’de [ürün listesi](http://127.0.0.1:8080/api/products) ve [örnek ürün detayı](http://127.0.0.1:8080/api/products/fender-player-ii) üzerinden veriyi kontrol edebilirsin.

### Yerel yönetici hesabı

Önce sitedeki **Hesabım → Kayıt ol** menüsünden hesap oluştur. İlk yöneticiye yetki vermek için DBeaver’da aşağıdaki sorguyu kendi kayıt e-postanla çalıştır.

```sql
UPDATE gearcompare_v2.app_user SET role = 'ADMIN' WHERE email = 'kendi-adresin@example.com';
```

Siteyi yenileyip **Yönetici paneli** bağlantısını aç. Yeni kayıtlar varsayılan olarak `USER` rolüyle oluşturulur. Favori, alarm ve bildirim API’lerinde kullanıcı kimliği sunucu oturumundan alınır.

Yönetici panelinden ürün, mağaza ve teklif ekleyebilirsin. Bir teklif ilk kez kaydedildiğinde veya fiyatı değiştiğinde güncel fiyat ve geçmiş satırı aynı işlemde yazılır. Bildirim servisi bu işlemde yayımlanan `OfferPriceChanged` olayını senkron bir `@EventListener` ile dinleyebilir. Olaydaki `previousPrice` ilk teklifte `null` olur. Bildirim yazımı aynı işlemi kullanmalıdır.

### Mağaza fiyatları ve fiyat grafiği

Mağaza fiyatları ve grafik, aynı MySQL veritabanındaki şu tablo ve sütunları okur. Tablo adlarını MySQL şemasında küçük harfle kullan.

| Tablo | Okunan sütunlar |
| --- | --- |
| `store` | `store_id`, `name`, `website` |
| `offer` | `offer_id`, `product_id`, `store_id`, `current_price` |
| `price_history` | `offer_id`, `recorded_at`, `price` |

`offer.product_id`, `product.product_id` alanına bağlanır. Her ürün ve mağaza eşleşmesinin tek bir teklifi olur. `price_history` için `(offer_id, recorded_at)` birleşik anahtarı ve `recorded_at` için MySQL `TIMESTAMP` kullanılır. En güncel en fazla 90 fiyat kaydı, seçilen mağazanın grafiğinde gösterilir.

Güncel mağaza fiyatları `GET /api/offers`, fiyat geçmişi `GET /api/offers/{offerId}/history` üzerinden gelir. Yalnızca katalog tabloları kuruluysa ürünler ve teknik karşılaştırma çalışır. Fiyatların görünmesi için teklif kayıtları, grafiğin görünmesi için de seçilen teklifin geçmiş kayıtları gerekir.

### 250 bin örnek fiyat kaydı

Katalog şeması ve migration uygulandıktan sonra DBeaver’da [sentetik fiyat seed’ini](output/sql/gearcompare_price_history_seed_mysql.sql) SQL script olarak çalıştır. Sonuç satırında sırasıyla 100 ürün, 5 mağaza, 500 teklif ve 250.000 fiyat kaydı görünür. Mevcut kayıtlar korunur. Seed tekrar çalıştırıldığında aynı test kayıtlarını çoğaltmaz.
