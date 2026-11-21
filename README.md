# GearCompare

Gitar, amfi ve efekt pedalları için fiyat karşılaştırma arayüzü. HTML, CSS ve JavaScript ile çalışır.

## Yerel önizleme

Proje klasöründe şu komutu çalıştırıp tarayıcıdan [http://localhost:8000](http://localhost:8000) adresini aç.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Altı kategoride arama yapabilir, marka filtresi uygulayabilir ve iki ürünü karşılaştırabilirsin. Ürün detayında teknik özellikler ve üretici bağlantısının yanında her mağazanın fiyat geçmişi yer alır.

Fiyat alarmını denemek için örnek bir e-posta ile demo hesabı oluştur ve bir ürünün en düşük teklifinin altında bir hedef belirle. Alt menüdeki **Yönetici paneli** üzerinden tekliflerden birini hedef fiyata veya altına çek. Yeni fiyatı **Ürün detayı**, bildirimi **Hesabım → Bildirimler** ekranında görebilirsin.

Mağazalar, fiyatlar ve fiyat geçmişi örnek veridir. Ürün fotoğrafları temsilidir. Demo kayıtları tarayıcıda saklanır. Sunucu kimlik doğrulaması, Spring Boot ve PostgreSQL bağlantısı frontend kapsamı dışındadır.
