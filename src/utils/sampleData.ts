/**
 * Authentic Indian Stock Market (NSE / BSE) Equity Transactions & Fundamentals Benchmark
 * Represents stocks across diverse Indian Sectors and Industries with INR (₹) valuations.
 * Strictly objective transaction records and fundamental performance metrics.
 * Does not contain any buy/sell recommendations or speculative predictions.
 */
export const DEFAULT_EQUITY_CSV = `Date,Symbol,Company Name,Sector,Industry,Action,Quantity,Price,Amount,Current Price,P/E Ratio,ROE (%),EPS,Revenue Growth (%),Profit Margin (%),Dividend Yield (%),52W High,52W Low,Beta,Market Cap
2023-01-16,RELIANCE,Reliance Industries Ltd.,Oil Gas & Consumable Fuels,Integrated Oil & Petrochemicals,BUY,30,2420.00,72600.00,2980.50,27.2,9.8,109.50,11.4,9.2,0.34,3217.90,2221.05,1.05,₹20.15 Lakh Cr
2023-02-10,TCS,Tata Consultancy Services Ltd.,Information Technology,IT Services & Consulting,BUY,20,3480.00,69600.00,4240.00,29.8,48.5,142.20,7.8,24.6,1.25,4592.25,3311.00,0.82,₹15.35 Lakh Cr
2023-03-15,HDFCBANK,HDFC Bank Ltd.,Financial Services,Private Sector Banking,BUY,50,1580.00,79000.00,1642.00,18.5,16.4,88.70,16.2,21.8,1.18,1794.00,1363.45,0.92,₹12.48 Lakh Cr
2023-04-20,INFY,Infosys Ltd.,Information Technology,IT Services & Consulting,BUY,40,1420.00,56800.00,1885.50,26.2,31.8,72.00,6.5,19.4,2.15,1975.00,1351.65,1.08,₹7.82 Lakh Cr
2023-05-18,ICICIBANK,ICICI Bank Ltd.,Financial Services,Private Sector Banking,BUY,60,940.00,56400.00,1235.00,17.8,18.2,69.40,21.4,26.5,0.85,1301.00,898.90,1.15,₹8.68 Lakh Cr
2023-06-22,ITC,ITC Ltd.,Fast Moving Consumer Goods,Cigarettes & Diversified FMCG,BUY,120,445.00,53400.00,498.50,28.1,29.4,17.70,8.2,28.5,2.75,510.65,399.30,0.68,₹6.22 Lakh Cr
2023-07-14,TATAMOTORS,Tata Motors Ltd.,Automobile and Auto Components,Passenger & Commercial Vehicles,BUY,60,620.00,37200.00,975.00,16.4,24.1,59.40,26.8,8.2,0.60,1179.05,593.50,1.42,₹3.58 Lakh Cr
2023-08-08,LT,Larsen & Toubro Ltd.,Construction & Infrastructure,Civil Engineering & Construction,BUY,18,2650.00,47700.00,3620.00,34.5,15.6,104.90,18.6,7.8,0.92,3919.90,2675.00,1.02,₹4.98 Lakh Cr
2023-09-12,BHARTIARTL,Bharti Airtel Ltd.,Telecommunication,Wireless Telecommunication,BUY,45,860.00,38700.00,1560.00,54.2,14.8,28.80,13.2,11.6,0.50,1648.00,885.00,0.88,₹9.12 Lakh Cr
2023-10-19,SBIN,State Bank of India,Financial Services,Public Sector Banking,BUY,65,570.00,37050.00,785.00,10.2,17.5,76.90,14.5,15.2,1.75,912.00,543.15,1.24,₹7.01 Lakh Cr
2023-11-20,HINDUNILVR,Hindustan Unilever Ltd.,Fast Moving Consumer Goods,Household & Personal Products,BUY,18,2520.00,45360.00,2690.00,58.4,21.0,46.00,5.8,17.9,1.55,2768.50,2170.25,0.62,₹6.32 Lakh Cr
2023-12-14,ITC,ITC Ltd.,Fast Moving Consumer Goods,Cigarettes & Diversified FMCG,DIVIDEND,120,6.25,750.00,498.50,28.1,29.4,17.70,8.2,28.5,2.75,510.65,399.30,0.68,₹6.22 Lakh Cr
2024-01-18,BAJFINANCE,Bajaj Finance Ltd.,Financial Services,NBFC & Consumer Finance,BUY,10,7150.00,71500.00,7280.00,31.2,22.4,233.30,24.8,22.1,0.50,8190.00,6355.00,1.35,₹4.50 Lakh Cr
2024-02-14,TATAMOTORS,Tata Motors Ltd.,Automobile and Auto Components,Passenger & Commercial Vehicles,SELL,20,920.00,18400.00,975.00,16.4,24.1,59.40,26.8,8.2,0.60,1179.05,593.50,1.42,₹3.58 Lakh Cr
2024-03-21,TITAN,Titan Company Ltd.,Consumer Services & Discretionary,Lifestyle & Jewellery Retail,BUY,12,3210.00,38520.00,3420.00,82.5,28.5,41.40,19.2,8.4,0.32,3886.95,3055.65,0.95,₹3.04 Lakh Cr
2024-04-15,SUNPHARMA,Sun Pharmaceutical Ind. Ltd.,Healthcare & Pharmaceuticals,Formulations & Bulk Drugs,BUY,25,1490.00,37250.00,1820.00,37.8,16.2,48.10,12.5,19.8,0.74,1915.00,1095.00,0.72,₹4.36 Lakh Cr
2024-05-10,MARUTI,Maruti Suzuki India Ltd.,Automobile and Auto Components,Passenger Cars & Utility,BUY,4,11850.00,47400.00,12150.00,28.0,16.8,433.90,15.6,9.8,1.10,13066.00,9960.00,0.98,₹3.82 Lakh Cr
2024-05-28,NTPC,NTPC Ltd.,Power & Utilities,Thermal & Renewable Generation,BUY,80,310.00,24800.00,412.00,15.8,13.5,26.10,14.8,12.4,2.25,448.00,225.00,0.85,₹4.12 Lakh Cr
2024-06-12,POWERGRID,Power Grid Corp. of India,Power & Utilities,Electric Power Transmission,BUY,90,265.00,23850.00,345.00,19.5,18.8,17.70,8.6,31.2,3.40,366.50,198.00,0.65,₹3.20 Lakh Cr
2024-06-25,TATASTEEL,Tata Steel Ltd.,Metals & Mining,Iron & Steel Products,BUY,150,135.00,20250.00,158.00,35.4,4.2,4.46,6.2,3.1,2.30,184.60,118.25,1.28,₹2.05 Lakh Cr
2024-07-04,COALINDIA,Coal India Ltd.,Oil Gas & Consumable Fuels,Coal & Solid Fuels,BUY,50,430.00,21500.00,495.00,8.2,48.0,60.40,9.2,27.8,5.40,543.55,272.00,0.78,₹3.10 Lakh Cr
2024-07-18,ONGC,Oil and Natural Gas Corp.,Oil Gas & Consumable Fuels,Oil & Gas Exploration,BUY,70,260.00,18200.00,315.00,7.8,14.8,40.40,11.5,13.8,4.10,344.00,178.50,0.95,₹3.75 Lakh Cr
2024-08-02,ULTRACEMCO,UltraTech Cement Ltd.,Cement & Construction Materials,Cement & Building Materials,BUY,4,9600.00,38400.00,11250.00,42.0,13.8,267.80,12.4,10.2,0.65,12025.00,7820.00,1.05,₹3.25 Lakh Cr
2024-08-15,BEL,Bharat Electronics Ltd.,Aerospace & Defense,Defense Electronics & Avionics,BUY,60,255.00,15300.00,305.00,42.0,25.4,7.26,18.5,19.6,0.80,340.50,128.00,0.89,₹2.18 Lakh Cr
2024-08-28,HAL,Hindustan Aeronautics Ltd.,Aerospace & Defense,Defense Electronics & Avionics,BUY,8,4350.00,34800.00,4820.00,36.5,29.8,132.10,21.2,25.4,0.90,5675.00,1865.00,0.94,₹3.12 Lakh Cr
2024-09-05,TRENT,Trent Ltd.,Consumer Services & Discretionary,Apparel & Specialty Retail,BUY,6,6150.00,36900.00,7120.00,145.0,28.4,49.10,48.5,10.2,0.05,7450.00,2050.00,1.10,₹2.65 Lakh Cr
2024-09-12,ZOMATO,Zomato Ltd.,Consumer Services & Discretionary,Internet Consumer Services,BUY,100,210.00,21000.00,275.00,95.0,6.8,2.89,68.4,4.8,0.00,298.00,95.00,1.22,₹2.45 Lakh Cr
2024-09-18,APOLLOHOSP,Apollo Hospitals Enterprise,Healthcare & Pharmaceuticals,Healthcare Facilities & Hospitals,BUY,5,6280.00,31400.00,7150.00,78.0,14.5,91.60,15.2,6.4,0.22,7350.00,4725.00,0.84,₹1.02 Lakh Cr
`;
