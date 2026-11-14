
package br.com.sptech.carros.config;

import br.com.sptech.carros.domain.Carro;
import br.com.sptech.carros.repository.CarroRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Popula o H2 com mais de 200 carros clássicos e esportivos.
 *
 * Formato de cada linha:
 * modelo|marca|ano|país|motor|potência
 */
@Component
public class CargaInicialCarros implements CommandLineRunner {

	private static final Logger log =
			LoggerFactory.getLogger(CargaInicialCarros.class);

	private static final String[] CORES = {
			"Vermelho", "Prata", "Azul", "Verde", "Preto",
			"Branco", "Amarelo", "Grafite", "Bordô", "Azul-petróleo"
	};

	private static final String[] CURADORES = {
			"Museu do Automóvel",
			"Coleção Privada",
			"Curadoria SPTech",
			"Clube dos Clássicos",
			"Acervo Histórico"
	};

	/*
	 * Os 100 registros originais foram mantidos.
	 * A lista também inclui os veículos dos quatro jogos
	 * e os 20 veículos adicionais solicitados.
	 */
	private static final String DADOS = """
        300 SL Gullwing|Mercedes-Benz|1954|Alemanha|6 cil. 3.0 L|215
        250 GTO|Ferrari|1962|Itália|V12 3.0 L|300
        DB5|Aston Martin|1963|Reino Unido|6 cil. 4.0 L|282
        E-Type Série 1|Jaguar|1961|Reino Unido|6 cil. 3.8 L|265
        911 Carrera RS 2.7|Porsche|1973|Alemanha|6 cil. 2.7 L|210
        Miura P400|Lamborghini|1966|Itália|V12 3.9 L|350
        Countach LP400|Lamborghini|1974|Itália|V12 4.0 L|375
        Stratos HF|Lancia|1973|Itália|V6 2.4 L|190
        037 Stradale|Lancia|1982|Itália|4 cil. 2.1 L turbo|205
        Giulia Sprint GTA|Alfa Romeo|1965|Itália|4 cil. 1.6 L|115
        Giulia TZ2|Alfa Romeo|1965|Itália|4 cil. 1.6 L|170
        33 Stradale|Alfa Romeo|1967|Itália|V8 2.0 L|230
        Dino 246 GT|Ferrari|1969|Itália|V6 2.4 L|195
        365 GTB/4 Daytona|Ferrari|1968|Itália|V12 4.4 L|352
        F40|Ferrari|1987|Itália|V8 2.9 L turbo|478
        288 GTO|Ferrari|1984|Itália|V8 2.9 L turbo|400
        Testarossa|Ferrari|1984|Itália|Flat-12 4.9 L|390
        512 BB|Ferrari|1976|Itália|Flat-12 4.9 L|360
        250 GT California Spyder|Ferrari|1958|Itália|V12 3.0 L|240
        250 Testa Rossa|Ferrari|1957|Itália|V12 3.0 L|300
        300 SLR Uhlenhaut Coupé|Mercedes-Benz|1955|Alemanha|8 cil. 3.0 L|310
        540K Roadster|Mercedes-Benz|1936|Alemanha|8 cil. 5.4 L|180
        SSK|Mercedes-Benz|1928|Alemanha|6 cil. 7.1 L|200
        190E 2.5-16 Evolution II|Mercedes-Benz|1990|Alemanha|4 cil. 2.5 L|235
        300 SEL 6.3|Mercedes-Benz|1968|Alemanha|V8 6.3 L|250
        356 Speedster|Porsche|1955|Alemanha|4 cil. 1.5 L|70
        356 Carrera 2|Porsche|1962|Alemanha|4 cil. 2.0 L|130
        911 Turbo 3.0|Porsche|1975|Alemanha|6 cil. 3.0 L turbo|260
        959|Porsche|1986|Alemanha|6 cil. 2.8 L turbo|450
        550 Spyder|Porsche|1953|Alemanha|4 cil. 1.5 L|110
        904 Carrera GTS|Porsche|1963|Alemanha|4/6 cil. 2.0 L|180
        Type 57SC Atlantic|Bugatti|1936|França|8 cil. 3.3 L|210
        Type 35B|Bugatti|1927|França|8 cil. 2.3 L|140
        Type 41 Royale|Bugatti|1930|França|8 cil. 12.8 L|300
        EB110 SS|Bugatti|1992|França|V12 3.5 L quad-turbo|610
        DS 21 Pallas|Citroën|1968|França|4 cil. 2.2 L|109
        SM|Citroën|1970|França|V6 2.7 L|180
        2CV Charleston|Citroën|1980|França|2 cil. 0.6 L|29
        Alpine A110 1600S|Alpine|1971|França|4 cil. 1.6 L|138
        R5 Turbo 2|Renault|1983|França|4 cil. 1.4 L turbo|160
        205 GTI 1.9|Peugeot|1987|França|4 cil. 1.9 L|130
        Quattro Sport|Audi|1984|Alemanha|5 cil. 2.1 L turbo|306
        Ur-Quattro|Audi|1980|Alemanha|5 cil. 2.1 L turbo|200
        Auto Union Type C|Auto Union|1936|Alemanha|V16 6.0 L|520
        328 Roadster|BMW|1937|Alemanha|6 cil. 2.0 L|80
        507|BMW|1956|Alemanha|V8 3.2 L|150
        3.0 CSL|BMW|1973|Alemanha|6 cil. 3.0 L|206
        M1|BMW|1978|Alemanha|6 cil. 3.5 L|277
        2002 Turbo|BMW|1973|Alemanha|4 cil. 2.0 L turbo|170
        Cooper S|Mini|1964|Reino Unido|4 cil. 1.3 L|75
        XK120|Jaguar|1948|Reino Unido|6 cil. 3.4 L|160
        XKSS|Jaguar|1957|Reino Unido|6 cil. 3.4 L|250
        C-Type|Jaguar|1951|Reino Unido|6 cil. 3.4 L|205
        D-Type|Jaguar|1955|Reino Unido|6 cil. 3.4 L|250
        XJ220|Jaguar|1992|Reino Unido|V6 3.5 L turbo|542
        Seven S2|Lotus|1960|Reino Unido|4 cil. 1.5 L|85
        Elan Sprint|Lotus|1971|Reino Unido|4 cil. 1.6 L|126
        Esprit Turbo|Lotus|1980|Reino Unido|4 cil. 2.2 L turbo|210
        Lotus 49|Lotus|1967|Reino Unido|V8 3.0 L|400
        Cobra 427|AC Cars|1965|Reino Unido|V8 7.0 L|425
        Cobra Daytona|Shelby|1964|EUA|V8 4.7 L|390
        GT40 Mk II|Ford|1966|EUA|V8 7.0 L|485
        Mustang Boss 429|Ford|1969|EUA|V8 7.0 L|375
        Mustang Shelby GT500|Ford|1967|EUA|V8 7.0 L|355
        Model T|Ford|1908|EUA|4 cil. 2.9 L|20
        Thunderbird|Ford|1955|EUA|V8 4.8 L|193
        Corvette C1|Chevrolet|1957|EUA|V8 4.6 L|283
        Corvette C2 Sting Ray|Chevrolet|1963|EUA|V8 5.4 L|360
        Corvette C3 Stingray|Chevrolet|1969|EUA|V8 7.0 L|435
        Bel Air|Chevrolet|1957|EUA|V8 4.6 L|185
        Camaro Z/28|Chevrolet|1968|EUA|V8 4.9 L|290
        Charger R/T|Dodge|1969|EUA|V8 7.2 L|375
        Challenger R/T|Dodge|1970|EUA|V8 7.0 L|425
        Barracuda Hemi|Plymouth|1970|EUA|V8 7.0 L|425
        Superbird|Plymouth|1970|EUA|V8 7.0 L|425
        GTO Judge|Pontiac|1969|EUA|V8 6.6 L|366
        Eldorado Biarritz|Cadillac|1959|EUA|V8 6.4 L|345
        V-16 Fleetwood|Cadillac|1930|EUA|V16 7.4 L|185
        300C|Chrysler|1957|EUA|V8 6.4 L|390
        Pantera|De Tomaso|1971|Itália|V8 5.8 L|330
        Mangusta|De Tomaso|1967|Itália|V8 4.7 L|306
        Iso Grifo|Iso|1965|Itália|V8 5.3 L|365
        250F|Maserati|1954|Itália|6 cil. 2.5 L|270
        Ghibli|Maserati|1967|Itália|V8 4.7 L|330
        Bora|Maserati|1971|Itália|V8 4.7 L|310
        MC12|Maserati|2004|Itália|V12 6.0 L|630
        5300 GT|Bizzarrini|1965|Itália|V8 5.3 L|365
        Enzo|Ferrari|2002|Itália|V12 6.0 L|660
        LaFerrari|Ferrari|2013|Itália|V12 6.3 L híbrido|963
        Carrera GT|Porsche|2004|Alemanha|V10 5.7 L|612
        F1|McLaren|1993|Reino Unido|V12 6.1 L|627
        P1|McLaren|2013|Reino Unido|V8 3.8 L híbrido|916
        Veyron|Bugatti|2005|França|W16 8.0 L quad-turbo|1001
        Diablo SV|Lamborghini|1995|Itália|V12 5.7 L|510
        Countach 25th|Lamborghini|1988|Itália|V12 5.2 L|455
        V8 Vantage|Aston Martin|1977|Reino Unido|V8 5.3 L|380
        DB4 GT Zagato|Aston Martin|1960|Reino Unido|6 cil. 3.7 L|314
        Ulster|Aston Martin|1934|Reino Unido|4 cil. 1.5 L|125
        Blower 4½ Litre|Bentley|1929|Reino Unido|4 cil. 4.4 L supercharged|240
        Phantom I|Rolls-Royce|1925|Reino Unido|6 cil. 7.7 L|95

        Chevrolet Opala SS 1976|Chevrolet|1976|Brasil|6 cil. 4.1 L|171
        Chevrolet Impala SS 1969|Chevrolet|1969|EUA|V8 7.0 L|390
        BMW M3 GTR|BMW|2001|Alemanha|V8 4.0 L|350
        Chevrolet Camaro SS 1969|Chevrolet|1969|EUA|V8 5.7 L|300
        Chevrolet Camaro Z28 1970|Chevrolet|1970|EUA|V8 5.7 L|360
        Ford Mustang Shelby GT500 1968|Ford|1968|EUA|V8 7.0 L|355
        Ford Mustang GT 1979|Ford|1979|EUA|V8 5.0 L|140
        Ford Maverick GT 1974|Ford|1974|Brasil|V8 5.0 L|197
        Dodge Challenger R/T 1970|Dodge|1970|EUA|V8 7.2 L|425
        Pontiac Firebird Trans Am 1977|Pontiac|1977|EUA|V8 6.6 L|200
        Chevrolet Chevelle SS 1970|Chevrolet|1970|EUA|V8 7.4 L|450
        Plymouth Road Runner 1970|Plymouth|1970|EUA|V8 7.0 L|390
        Chevrolet Corvette Stingray 1970|Chevrolet|1970|EUA|V8 5.7 L|300
        Ford Gran Torino 1974|Ford|1974|EUA|V8 5.8 L|250
        Porsche 911 Carrera RS 1973|Porsche|1973|Alemanha|6 cil. 2.7 L|210
        Volkswagen SP2 1973|Volkswagen|1973|Brasil|4 cil. 1.7 L|75
        Puma GTE 1974|Puma|1974|Brasil|4 cil. 1.6 L|70
        Nissan Skyline 2000 GT-R 1969|Nissan|1969|Japão|6 cil. 2.0 L|160

        """;

	private static final String DADOS_JOGOS = """
        Acura Integra Type R|Acura|2000|Japão|4 cil. 1.8 L|195
        Acura RSX Type-S|Acura|2003|Japão|4 cil. 2.0 L|200
        Dodge Neon|Dodge|1999|EUA|4 cil. 2.0 L|150
        Ford Focus ZX3|Ford|2003|EUA|4 cil. 2.0 L|130
        Honda Civic Si|Honda|2000|Japão|4 cil. 1.6 L|160
        Honda S2000|Honda|2003|Japão|4 cil. 2.0 L|240
        Hyundai Tiburon GT V6|Hyundai|2003|Coreia do Sul|V6 2.7 L|172
        Mazda MX-5 Miata|Mazda|1999|Japão|4 cil. 1.8 L|140
        Mazda RX-7|Mazda|1995|Japão|Rotativo 1.3 L turbo|255
        Mitsubishi Eclipse GSX|Mitsubishi|1999|Japão|4 cil. 2.0 L turbo|210
        Mitsubishi Lancer ES|Mitsubishi|2003|Japão|4 cil. 2.0 L|120
        Nissan 240SX SE|Nissan|1992|Japão|4 cil. 2.4 L|155
        Nissan 350Z|Nissan|2003|Japão|V6 3.5 L|287
        Nissan Sentra SE-R Spec V|Nissan|2004|Japão|4 cil. 2.5 L|175
        Nissan Skyline GT-R R34|Nissan|1999|Japão|6 cil. 2.6 L biturbo|280
        Peugeot 206 GTI|Peugeot|2003|França|4 cil. 2.0 L|138
        Subaru Impreza 2.5 RS|Subaru|2003|Japão|4 cil. 2.5 L|165
        Toyota Celica GT-S|Toyota|2002|Japão|4 cil. 1.8 L|180
        Toyota Supra|Toyota|1998|Japão|6 cil. 3.0 L biturbo|320
        Volkswagen Golf GTI|Volkswagen|2003|Alemanha|4 cil. 2.0 L|200

        Audi A3 3.2 quattro|Audi|2005|Alemanha|V6 3.2 L|250
        Audi TT 3.2 quattro|Audi|2004|Alemanha|V6 3.2 L|250
        Cadillac Escalade|Cadillac|2002|EUA|V8 5.3 L|285
        Ford Mustang GT|Ford|2005|EUA|V8 4.6 L|300
        Honda Civic Coupe Si|Honda|2002|Japão|4 cil. 2.0 L|160
        Hummer H2|Hummer|2003|EUA|V8 6.0 L|325
        Infiniti G35|Infiniti|2003|Japão|V6 3.5 L|280
        Lexus IS 300|Lexus|2002|Japão|6 cil. 3.0 L|215
        Lincoln Navigator|Lincoln|2003|EUA|V8 5.4 L|300
        Mazda RX-8|Mazda|2004|Japão|Rotativo 1.3 L|238
        Mitsubishi 3000GT VR-4|Mitsubishi|1999|Japão|V6 3.0 L biturbo|320
        Mitsubishi Eclipse GSX|Mitsubishi|1999|Japão|4 cil. 2.0 L turbo|210
        Mitsubishi Lancer Evolution VIII|Mitsubishi|2003|Japão|4 cil. 2.0 L turbo|271
        Nissan 350Z|Nissan|2003|Japão|V6 3.5 L|287
        Nissan Skyline GT-R V-Spec|Nissan|2002|Japão|6 cil. 2.6 L biturbo|280
        Peugeot 106 S16|Peugeot|2000|França|4 cil. 1.6 L|120
        Peugeot 206 S16|Peugeot|2003|França|4 cil. 2.0 L|138
        Pontiac GTO 2004|Pontiac|2004|EUA|V8 5.7 L|350
        Subaru Impreza WRX STI|Subaru|2004|Japão|4 cil. 2.5 L turbo|300
        Toyota Celica GT-S|Toyota|2003|Japão|4 cil. 1.8 L|180
        Toyota Corolla GT-S AE86|Toyota|1986|Japão|4 cil. 1.6 L|130
        Vauxhall Corsa 1.8|Vauxhall|2004|Reino Unido|4 cil. 1.8 L|125
        Mazda MX-5|Mazda|1999|Japão|4 cil. 1.8 L|140
        Volkswagen Golf GTI Mk5|Volkswagen|2005|Alemanha|4 cil. 2.0 L turbo|200
        Audi A4 3.2 FSI quattro|Audi|2005|Alemanha|V6 3.2 L|255

        Aston Martin DB9|Aston Martin|2005|Reino Unido|V12 5.9 L|450
        Audi A3 3.2 quattro|Audi|2005|Alemanha|V6 3.2 L|250
        Audi A4 3.2 FSI quattro|Audi|2005|Alemanha|V6 3.2 L|255
        Audi TT 3.2 quattro|Audi|2005|Alemanha|V6 3.2 L|250
        Cadillac CTS|Cadillac|2005|EUA|V6 3.6 L|255
        Chevrolet Cobalt SS|Chevrolet|2005|EUA|4 cil. 2.0 L supercharged|205
        Chevrolet Corvette C6|Chevrolet|2005|EUA|V8 6.0 L|400
        Dodge Viper SRT-10|Dodge|2005|EUA|V10 8.3 L|500
        Fiat Punto|Fiat|2005|Itália|4 cil. 1.8 L|130
        Ford GT|Ford|2005|EUA|V8 5.4 L supercharged|550
        Ford Mustang GT 2005|Ford|2005|EUA|V8 4.6 L|300
        Lamborghini Gallardo|Lamborghini|2005|Itália|V10 5.0 L|500
        Lamborghini Murciélago|Lamborghini|2005|Itália|V12 6.2 L|572
        Lotus Elise 111R|Lotus|2005|Reino Unido|4 cil. 1.8 L|189
        Mazda RX-7 FD|Mazda|1995|Japão|Rotativo 1.3 L turbo|255
        Mazda RX-8|Mazda|2004|Japão|Rotativo 1.3 L|238
        Mercedes-Benz CLK 500|Mercedes-Benz|2005|Alemanha|V8 5.0 L|302
        Mercedes-Benz SLR McLaren|Mercedes-Benz|2005|Alemanha|V8 5.4 L supercharged|617
        Mitsubishi Eclipse GT|Mitsubishi|2005|Japão|V6 3.0 L|210
        Mitsubishi Lancer Evolution VIII|Mitsubishi|2003|Japão|4 cil. 2.0 L turbo|271
        Porsche 911 Carrera S|Porsche|2005|Alemanha|6 cil. 3.8 L|355
        Porsche 911 Turbo|Porsche|2005|Alemanha|6 cil. 3.6 L biturbo|415
        Porsche Carrera GT|Porsche|2004|Alemanha|V10 5.7 L|612
        Porsche Cayman S|Porsche|2006|Alemanha|6 cil. 3.4 L|295
        Renault Clio V6|Renault|2005|França|V6 3.0 L|255
        Toyota Supra Turbo|Toyota|1998|Japão|6 cil. 3.0 L biturbo|320
        Vauxhall Monaro VXR|Vauxhall|2005|Reino Unido|V8 5.7 L|335
        Chevrolet Corvette C6.R|Chevrolet|2005|EUA|V8 7.0 L|500
        Mercedes-Benz SL 65 AMG|Mercedes-Benz|2005|Alemanha|V12 6.0 L biturbo|604
        Porsche 911 GT2|Porsche|2005|Alemanha|6 cil. 3.6 L biturbo|483
        BMW M3 GTR Black Edition|BMW|2001|Alemanha|V8 4.0 L|350
        Chevrolet Camaro SS Black Edition|Chevrolet|1967|EUA|V8 6.5 L|375

        Alfa Romeo Brera|Alfa Romeo|2006|Itália|V6 3.2 L|260
        Aston Martin DB9 Carbon|Aston Martin|2006|Reino Unido|V12 5.9 L|450
        Audi Le Mans quattro|Audi|2003|Alemanha|V10 5.0 L biturbo|610
        BMW M3 GTR Carbon|BMW|2003|Alemanha|V8 4.0 L|350
        Chevrolet Camaro Concept|Chevrolet|2006|EUA|V8 6.0 L|400
        Chevrolet Camaro SS Carbon|Chevrolet|1967|EUA|V8 6.5 L|375
        Chevrolet Corvette Z06|Chevrolet|2006|EUA|V8 7.0 L|505
        Chrysler 300C SRT8|Chrysler|2006|EUA|V8 6.1 L|425
        Dodge Challenger Concept|Dodge|2006|EUA|V8 6.1 L|425
        Dodge Charger SRT8|Dodge|2006|EUA|V8 6.1 L|425
        Dodge Viper SRT-10 Coupe|Dodge|2006|EUA|V10 8.3 L|500
        Ford GT Carbon|Ford|2005|EUA|V8 5.4 L supercharged|550
        Ford Mustang GT Carbon|Ford|2006|EUA|V8 4.6 L|300
        Infiniti G35 Carbon|Infiniti|2003|Japão|V6 3.5 L|280
        Jaguar XK|Jaguar|2007|Reino Unido|V8 4.2 L|300
        Koenigsegg CCX|Koenigsegg|2006|Suécia|V8 4.7 L supercharged|806
        Lamborghini Gallardo Carbon|Lamborghini|2006|Itália|V10 5.0 L|520
        Lamborghini Murciélago LP640|Lamborghini|2007|Itália|V12 6.5 L|640
        Lexus IS 300 Carbon|Lexus|2001|Japão|6 cil. 3.0 L|215
        Lotus Elise Carbon|Lotus|2004|Reino Unido|4 cil. 1.8 L|189
        Lotus Europa S|Lotus|2006|Reino Unido|4 cil. 2.0 L turbo|200
        Mazda Mazdaspeed3|Mazda|2007|Japão|4 cil. 2.3 L turbo|263
        Mazda RX-7 Carbon|Mazda|1999|Japão|Rotativo 1.3 L turbo|255
        Mazda RX-8 Carbon|Mazda|2003|Japão|Rotativo 1.3 L|232
        Mercedes-Benz CLK 500 Carbon|Mercedes-Benz|2005|Alemanha|V8 5.0 L|302
        Mercedes-Benz SL65 AMG Carbon|Mercedes-Benz|2005|Alemanha|V12 6.0 L biturbo|604
        Mercedes-Benz SLR McLaren Carbon|Mercedes-Benz|2004|Alemanha|V8 5.4 L supercharged|617
        Mitsubishi Eclipse GSX Carbon|Mitsubishi|1999|Japão|4 cil. 2.0 L turbo|210
        Mitsubishi Eclipse GT Carbon|Mitsubishi|2006|Japão|V6 3.0 L|210
        Mitsubishi Lancer Evolution IX MR|Mitsubishi|2006|Japão|4 cil. 2.0 L turbo|286
        Nissan 240SX Carbon|Nissan|1992|Japão|4 cil. 2.4 L|155
        Nissan 350Z Carbon|Nissan|2006|Japão|V6 3.5 L|300
        Nissan Skyline GT-R R34 Carbon|Nissan|1999|Japão|6 cil. 2.6 L biturbo|276
        Pagani Zonda F|Pagani|2006|Itália|V12 7.3 L|602
        Plymouth Hemi Cuda|Plymouth|1970|EUA|V8 7.0 L|425
        Plymouth Road Runner Carbon|Plymouth|1969|EUA|V8 7.0 L|390
        Pontiac GTO Carbon|Pontiac|2005|EUA|V8 6.0 L|400
        Porsche Carrera GT Carbon|Porsche|2004|Alemanha|V10 5.7 L|612
        Porsche Cayman S Carbon|Porsche|2006|Alemanha|6 cil. 3.4 L|295
        Porsche 911 Turbo Carbon|Porsche|2007|Alemanha|6 cil. 3.6 L biturbo|480
        Porsche 911 GT3 RS|Porsche|2006|Alemanha|6 cil. 3.6 L|415
        Renault Clio V6 Carbon|Renault|2005|França|V6 3.0 L|255
        Shelby GT500 1967|Shelby|1967|EUA|V8 7.0 L|355
        Shelby GT500 2007|Ford|2007|EUA|V8 5.4 L supercharged|500
        Subaru Impreza WRX STI Carbon|Subaru|2006|Japão|4 cil. 2.5 L turbo|300
        Toyota Corolla GT-S Carbon|Toyota|1985|Japão|4 cil. 1.6 L|138
        Toyota MR2|Toyota|1993|Japão|4 cil. 2.0 L turbo|200
        Toyota Supra Carbon|Toyota|1998|Japão|6 cil. 3.0 L biturbo|320
        Vauxhall Monaro VXR Carbon|Vauxhall|2005|Reino Unido|V8 5.7 L|335
        Volkswagen Golf R32|Volkswagen|2006|Alemanha|V6 3.2 L|250
        Chevrolet Chevelle SS Carbon|Chevrolet|1970|EUA|V8 7.4 L|450
        Dodge Charger R/T Carbon|Dodge|1969|EUA|V8 7.2 L|375
        Dodge Challenger R/T Carbon|Dodge|1971|EUA|V8 7.2 L|425
        Aston Martin DB9 Bonus|Aston Martin|2005|Reino Unido|V12 5.9 L|450
        Ford Mustang Shelby GT500 Bonus|Ford|2007|EUA|V8 5.4 L supercharged|500
        Nissan Skyline GT-R Bonus|Nissan|1999|Japão|6 cil. 2.6 L biturbo|276
        """;

	private final CarroRepository repository;

	public CargaInicialCarros(CarroRepository repository) {
		this.repository = repository;
	}

	@Override
	public void run(String... args) {

		if (repository.count() > 0) {
			log.info(
					"Base já possui {} carros; carga inicial não será repetida.",
					repository.count()
			);
			return;
		}

		List<Carro> carros = new ArrayList<>();
		int indice = 0;

		List<String> conjuntosDados = List.of(DADOS, DADOS_JOGOS);

		for (String conjunto : conjuntosDados) {

			for (String linha : conjunto.strip().lines().toList()) {

				if (linha.isBlank()) {
					continue;
				}

				String[] campos = linha.split("\\|");

				if (campos.length != 6) {
					log.warn("Registro inválido ignorado: {}", linha);
					continue;
				}

				Carro carro = new Carro(
						campos[0].trim(),
						campos[1].trim(),
						Integer.parseInt(campos[2].trim()),
						campos[3].trim(),
						campos[4].trim(),
						Integer.parseInt(campos[5].trim()),
						CORES[indice % CORES.length],
						descricao(campos),
						CURADORES[indice % CURADORES.length]
				);

				carro.setAtualizadoEm(
						Instant.now().minusSeconds(60L * indice)
				);

				carros.add(carro);
				indice++;
			}
		}

		repository.saveAll(carros);

		log.info(
				"Base H2 populada com {} carros clássicos e esportivos.",
				carros.size()
		);
	}

	private String descricao(String[] campos) {

		return "Exemplar de %s %s de %d, equipado com motor %s de %s cv. "
				.formatted(
						campos[1].trim(),
						campos[0].trim(),
						Integer.parseInt(campos[2].trim()),
						campos[4].trim(),
						campos[5].trim()
				)
				+ "Um dos grandes nomes da história automotiva de %s, "
				.formatted(campos[3].trim())
				+ "preservado em configuração original e mantido em coleção particular. "
				+ "O conjunto mecânico, a pintura e o interior de época fazem "
				+ "deste exemplar uma peça de destaque em qualquer acervo.";
	}
}

