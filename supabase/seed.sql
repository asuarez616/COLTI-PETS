insert into public.sizes(code,neck_min,neck_max,weight_reference) values
 ('2XS',17,25,'1–2'),('XS',22,35,'2–4'),('S',25,40,'3–6'),('SM',30,45,'6–12'),('M',32,50,'12–18'),('ML',35,55,'19–25'),('L',40,60,'26–35'),('XL',44,65,'36–45'),('2XL',47,70,'>46') on conflict(code) do nothing;
insert into public.size_widths values ('2XS',1),('XS',1),('XS',1.5),('S',1.5),('S',2),('SM',2),('M',2.5),('ML',2.5),('ML',3),('L',3),('XL',3),('2XL',3) on conflict do nothing;
insert into public.designs(id,code,type,image_path,is_test_data,display_order,asset_version) values
 ('10000000-0000-4000-8000-000000000001','CH-17-1','woven','CH-17-1.png',true,1,'test-v1'),
 ('10000000-0000-4000-8000-000000000002','TEST-PRINTED-02','printed','design-test-02.png',true,2,'test-v1') on conflict(id) do nothing;
-- DEMONSTRATION ONLY: not commercially approved compatibility.
insert into public.design_compatibility(design_id,size_code,width_cm) select d.id,w.size_code,w.width_cm from public.designs d cross join public.size_widths w where d.is_test_data on conflict do nothing;
insert into public.fonts(number,label,state) select n,'Font '||n,'placeholder' from generate_series(1,36) n on conflict(number) do nothing;
