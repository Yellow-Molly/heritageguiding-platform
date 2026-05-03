--
-- PostgreSQL database dump
--

\restrict uq1AnIewlh1kTmioAeDz5QSsahwsFaWES43CZ7mncVSodYCxbvZnWRgKRK49xRp

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    slug character varying NOT NULL,
    type public.enum_categories_type DEFAULT 'theme'::public.enum_categories_type NOT NULL,
    icon character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: categories_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories_locales (
    name character varying NOT NULL,
    description character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.categories_locales OWNER TO postgres;

--
-- Name: categories_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_locales_id_seq OWNER TO postgres;

--
-- Name: categories_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_locales_id_seq OWNED BY public.categories_locales.id;


--
-- Name: tours; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tours (
    id integer NOT NULL,
    slug character varying NOT NULL,
    pricing_base_price numeric NOT NULL,
    pricing_currency public.enum_tours_pricing_currency DEFAULT 'SEK'::public.enum_tours_pricing_currency,
    pricing_price_type public.enum_tours_pricing_price_type NOT NULL,
    pricing_group_discount boolean DEFAULT false,
    pricing_child_price numeric,
    duration_hours numeric NOT NULL,
    logistics_coordinates public.geometry(Point),
    logistics_google_maps_link character varying,
    difficulty_level public.enum_tours_difficulty_level,
    age_recommendation_minimum_age numeric,
    age_recommendation_child_friendly boolean DEFAULT false,
    age_recommendation_teen_friendly boolean DEFAULT false,
    accessibility_wheelchair_accessible boolean DEFAULT false,
    accessibility_hearing_assistance boolean DEFAULT false,
    accessibility_visual_assistance boolean DEFAULT false,
    accessibility_service_animals_allowed boolean DEFAULT true,
    guide_id integer NOT NULL,
    bokun_experience_id character varying,
    availability public.enum_tours_availability DEFAULT 'available'::public.enum_tours_availability,
    max_group_size numeric,
    min_group_size numeric DEFAULT 1,
    seo_og_image_id integer,
    featured boolean DEFAULT false,
    status public.enum_tours_status DEFAULT 'draft'::public.enum_tours_status,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tours OWNER TO postgres;

--
-- Name: tours_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tours_id_seq OWNER TO postgres;

--
-- Name: tours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tours_id_seq OWNED BY public.tours.id;


--
-- Name: tours_rels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tours_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    categories_id integer,
    neighborhoods_id integer,
    cities_id integer
);


ALTER TABLE public.tours_rels OWNER TO postgres;

--
-- Name: tours_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tours_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tours_rels_id_seq OWNER TO postgres;

--
-- Name: tours_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tours_rels_id_seq OWNED BY public.tours_rels.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: categories_locales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_locales ALTER COLUMN id SET DEFAULT nextval('public.categories_locales_id_seq'::regclass);


--
-- Name: tours id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours ALTER COLUMN id SET DEFAULT nextval('public.tours_id_seq'::regclass);


--
-- Name: tours_rels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours_rels ALTER COLUMN id SET DEFAULT nextval('public.tours_rels_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, slug, type, icon, updated_at, created_at) FROM stdin;
35	history-heritage	theme	castle	2026-04-26 18:07:14.013+02	2026-04-26 18:00:57.207+02
36	viking-medieval	theme	swords	2026-04-26 18:07:14.052+02	2026-04-26 18:00:57.223+02
37	architecture	theme	landmark	2026-04-26 18:07:14.087+02	2026-04-26 18:00:57.237+02
38	culture-local-life	theme	users	2026-04-26 18:07:14.12+02	2026-04-26 18:00:57.252+02
12	family-friendly	theme	baby	2026-04-26 18:07:14.156+02	2026-03-28 21:56:21.162+01
39	nature-water	theme	trees	2026-04-26 18:07:14.185+02	2026-04-26 18:00:57.289+02
40	walking-tour	activity	footprints	2026-04-26 18:07:14.212+02	2026-04-26 18:00:57.303+02
41	boat-tour	activity	ship	2026-04-26 18:07:14.238+02	2026-04-26 18:00:57.317+02
42	chauffeured-tour	activity	car	2026-04-26 18:07:14.262+02	2026-04-26 18:00:57.332+02
43	day-trip	activity	calendar	2026-04-26 18:07:14.29+02	2026-04-26 18:00:57.346+02
\.


--
-- Data for Name: categories_locales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories_locales (name, description, id, _locale, _parent_id) FROM stdin;
Historia & arvskap	\N	105	sv	35
History & Heritage	\N	106	en	35
Geschichte & Erbe	\N	107	de	35
Vikingatid & medeltid	\N	117	sv	36
Viking & Medieval	\N	118	en	36
Wikinger & Mittelalter	\N	119	de	36
Arkitektur	\N	129	sv	37
Architecture	\N	130	en	37
Architektur	\N	131	de	37
Kultur & vardagsliv	\N	141	sv	38
Culture & Local Life	\N	142	en	38
Kultur & Alltagsleben	\N	143	de	38
Familjevänligt	\N	153	sv	12
Family-Friendly	\N	154	en	12
Familienfreundlich	\N	155	de	12
Natur & vatten	\N	165	sv	39
Nature & Water	\N	166	en	39
Natur & Wasser	\N	167	de	39
Vandringstur	\N	177	sv	40
Walking Tour	\N	178	en	40
Spaziergang	\N	179	de	40
Båttur	\N	189	sv	41
Boat Tour	\N	190	en	41
Bootstour	\N	191	de	41
Chaufförsguidad tur	\N	201	sv	42
Chauffeured Tour	\N	202	en	42
Chauffeurtour	\N	203	de	42
Dagsutflykt	\N	213	sv	43
Day Trip	\N	214	en	43
Tagesausflug	\N	215	de	43
\.


--
-- Data for Name: tours; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tours (id, slug, pricing_base_price, pricing_currency, pricing_price_type, pricing_group_discount, pricing_child_price, duration_hours, logistics_coordinates, logistics_google_maps_link, difficulty_level, age_recommendation_minimum_age, age_recommendation_child_friendly, age_recommendation_teen_friendly, accessibility_wheelchair_accessible, accessibility_hearing_assistance, accessibility_visual_assistance, accessibility_service_animals_allowed, guide_id, bokun_experience_id, availability, max_group_size, min_group_size, seo_og_image_id, featured, status, updated_at, created_at) FROM stdin;
12	stockholm-everyday-life-private-tour	5500	SEK	per_group	f	\N	4	\N	\N	moderate	12	t	t	t	f	f	t	15	\N	available	7	1	67	t	published	2026-04-26 18:07:14.39+02	2026-03-28 23:35:53.191+01
11	slow-travel-stockholm-archipelago-classic-boat	19000	SEK	per_group	f	\N	8	0101000020E61000002D38FD85101532409D24DCB263AA4D40	https://maps.app.goo.gl/yksxPY5jwUiZ7hzt6	easy	6	t	t	f	f	f	f	16	\N	available	5	1	56	f	published	2026-04-26 18:07:14.579+02	2026-03-28 23:35:53.041+01
10	slow-travel-malaren-classic-boat-stockholm	11000	SEK	per_group	f	\N	4	0101000020E61000006A194114E00E3240C398DB5AF2A94D40	https://maps.app.goo.gl/sPsZAuURXq9zkUHP8	easy	6	t	t	f	f	f	f	16	\N	available	5	1	44	t	published	2026-04-26 18:07:14.646+02	2026-03-28 23:35:52.901+01
9	gamla-stan-and-stockholm-city-hall-private-walking-tour	3900	SEK	per_group	f	\N	3	0101000020E6100000077C3CFC4E123240A0E61938B6A94D40	https://maps.app.goo.gl/Ud5kfYBWSvJtHoiY6	moderate	12	f	t	t	f	f	f	15	\N	available	9	1	1	t	published	2026-04-26 18:07:14.699+02	2026-03-28 23:35:52.766+01
8	gamla-stan-and-vasa-museum-private-walking-tour	3900	SEK	per_group	f	\N	3	0101000020E61000007CC6C51EC8123240C54455DC50A94D40	https://maps.app.goo.gl/r597kSJn6cssHn4r5	moderate	12	f	t	t	f	f	f	12	\N	available	9	1	12	f	published	2026-04-26 18:07:14.75+02	2026-03-28 23:35:52.619+01
7	private-uppsala-day-tour-from-stockholm	12900	SEK	per_group	f	\N	8	\N	\N	easy	0	t	t	t	f	f	t	17	\N	available	7	1	37	f	published	2026-04-26 18:07:14.803+02	2026-03-28 23:35:52.474+01
6	private-sigtuna-heritage-tour-from-stockholm	9800	SEK	per_group	f	\N	6	\N	\N	easy	0	t	t	t	f	f	t	17	\N	available	7	1	35	t	published	2026-04-26 18:07:14.856+02	2026-03-28 23:35:52.316+01
5	stockholm-islands-and-districts-private-overview-by-car-3-hour	5500	SEK	per_group	f	\N	3	\N	\N	easy	0	t	t	t	f	f	t	14	\N	available	7	1	73	f	published	2026-04-26 18:07:14.911+02	2026-03-28 23:35:52.15+01
4	private-medieval-stockholm-walking-tour	2800	SEK	per_group	f	\N	2	0101000020E6100000253725814F123240B2B61081B6A94D40	https://maps.app.goo.gl/6vMNd9kCBXa914YQ8	easy	0	t	t	f	f	f	t	11	\N	available	9	1	17	t	published	2026-04-26 18:07:14.962+02	2026-03-28 23:35:51.993+01
3	private-rib-tour-stockholm-3h	14000	SEK	per_group	f	\N	3	0101000020E61000002D38FD85101532409D24DCB263AA4D40	https://maps.app.goo.gl/yksxPY5jwUiZ7hzt6	easy	120	t	t	f	f	f	f	13	\N	available	12	1	27	t	published	2026-04-26 18:07:15.011+02	2026-03-28 23:35:51.764+01
\.


--
-- Data for Name: tours_rels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tours_rels (id, "order", parent_id, path, categories_id, neighborhoods_id, cities_id) FROM stdin;
744	1	12	categories	40	\N	\N
745	2	12	categories	38	\N	\N
746	1	12	cities	\N	\N	1
747	1	12	neighborhoods	\N	10	\N
748	2	12	neighborhoods	\N	11	\N
749	3	12	neighborhoods	\N	14	\N
750	4	12	neighborhoods	\N	1	\N
751	5	12	neighborhoods	\N	17	\N
752	1	11	categories	41	\N	\N
753	2	11	categories	43	\N	\N
754	1	11	cities	\N	\N	1
755	1	11	neighborhoods	\N	19	\N
756	2	11	neighborhoods	\N	2	\N
757	3	11	neighborhoods	\N	3	\N
758	4	11	neighborhoods	\N	18	\N
759	1	10	categories	41	\N	\N
760	2	10	categories	43	\N	\N
761	1	10	cities	\N	\N	1
762	1	10	neighborhoods	\N	6	\N
763	2	10	neighborhoods	\N	9	\N
764	3	10	neighborhoods	\N	17	\N
765	1	9	categories	40	\N	\N
766	2	9	categories	35	\N	\N
767	3	9	categories	37	\N	\N
768	1	9	cities	\N	\N	1
769	1	9	neighborhoods	\N	4	\N
770	2	9	neighborhoods	\N	12	\N
771	3	9	neighborhoods	\N	7	\N
772	4	9	neighborhoods	\N	15	\N
773	1	8	categories	38	\N	\N
774	1	8	cities	\N	\N	1
775	1	8	neighborhoods	\N	4	\N
776	2	8	neighborhoods	\N	19	\N
777	3	8	neighborhoods	\N	1	\N
778	4	8	neighborhoods	\N	22	\N
779	1	7	cities	\N	\N	1
780	2	7	cities	\N	\N	3
781	1	7	neighborhoods	\N	17	\N
782	2	7	neighborhoods	\N	20	\N
783	3	7	neighborhoods	\N	5	\N
784	4	7	neighborhoods	\N	21	\N
785	1	6	cities	\N	\N	1
786	2	6	cities	\N	\N	2
787	1	6	neighborhoods	\N	17	\N
788	2	6	neighborhoods	\N	8	\N
789	3	6	neighborhoods	\N	13	\N
790	1	5	categories	42	\N	\N
791	1	5	cities	\N	\N	1
792	1	5	neighborhoods	\N	4	\N
793	2	5	neighborhoods	\N	12	\N
794	3	5	neighborhoods	\N	14	\N
795	4	5	neighborhoods	\N	7	\N
796	5	5	neighborhoods	\N	11	\N
797	6	5	neighborhoods	\N	1	\N
798	7	5	neighborhoods	\N	10	\N
799	1	4	categories	35	\N	\N
800	2	4	categories	40	\N	\N
801	3	4	categories	12	\N	\N
802	1	4	cities	\N	\N	1
803	1	4	neighborhoods	\N	4	\N
804	2	4	neighborhoods	\N	17	\N
805	1	3	categories	41	\N	\N
806	1	3	cities	\N	\N	1
807	1	3	neighborhoods	\N	17	\N
808	2	3	neighborhoods	\N	1	\N
809	3	3	neighborhoods	\N	16	\N
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 43, true);


--
-- Name: categories_locales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_locales_id_seq', 215, true);


--
-- Name: tours_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tours_id_seq', 12, true);


--
-- Name: tours_rels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tours_rels_id_seq', 809, true);


--
-- Name: categories_locales categories_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_locales
    ADD CONSTRAINT categories_locales_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);


--
-- Name: tours_rels tours_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours_rels
    ADD CONSTRAINT tours_rels_pkey PRIMARY KEY (id);


--
-- Name: categories_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_created_at_idx ON public.categories USING btree (created_at);


--
-- Name: categories_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_locales_locale_parent_id_unique ON public.categories_locales USING btree (_locale, _parent_id);


--
-- Name: categories_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_slug_idx ON public.categories USING btree (slug);


--
-- Name: categories_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_updated_at_idx ON public.categories USING btree (updated_at);


--
-- Name: tours_availability_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_availability_idx ON public.tours USING btree (availability);


--
-- Name: tours_bokun_experience_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_bokun_experience_id_idx ON public.tours USING btree (bokun_experience_id);


--
-- Name: tours_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_created_at_idx ON public.tours USING btree (created_at);


--
-- Name: tours_featured_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_featured_idx ON public.tours USING btree (featured);


--
-- Name: tours_guide_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_guide_idx ON public.tours USING btree (guide_id);


--
-- Name: tours_rels_categories_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_rels_categories_id_idx ON public.tours_rels USING btree (categories_id);


--
-- Name: tours_rels_cities_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_rels_cities_id_idx ON public.tours_rels USING btree (cities_id);


--
-- Name: tours_rels_neighborhoods_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_rels_neighborhoods_id_idx ON public.tours_rels USING btree (neighborhoods_id);


--
-- Name: tours_rels_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_rels_order_idx ON public.tours_rels USING btree ("order");


--
-- Name: tours_rels_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_rels_parent_idx ON public.tours_rels USING btree (parent_id);


--
-- Name: tours_rels_path_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_rels_path_idx ON public.tours_rels USING btree (path);


--
-- Name: tours_seo_seo_og_image_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_seo_seo_og_image_idx ON public.tours USING btree (seo_og_image_id);


--
-- Name: tours_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tours_slug_idx ON public.tours USING btree (slug);


--
-- Name: tours_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_status_idx ON public.tours USING btree (status);


--
-- Name: tours_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tours_updated_at_idx ON public.tours USING btree (updated_at);


--
-- Name: categories_locales categories_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories_locales
    ADD CONSTRAINT categories_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: tours tours_guide_id_guides_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_guide_id_guides_id_fk FOREIGN KEY (guide_id) REFERENCES public.guides(id) ON DELETE SET NULL;


--
-- Name: tours_rels tours_rels_categories_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours_rels
    ADD CONSTRAINT tours_rels_categories_fk FOREIGN KEY (categories_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: tours_rels tours_rels_cities_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours_rels
    ADD CONSTRAINT tours_rels_cities_fk FOREIGN KEY (cities_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: tours_rels tours_rels_neighborhoods_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours_rels
    ADD CONSTRAINT tours_rels_neighborhoods_fk FOREIGN KEY (neighborhoods_id) REFERENCES public.neighborhoods(id) ON DELETE CASCADE;


--
-- Name: tours_rels tours_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours_rels
    ADD CONSTRAINT tours_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.tours(id) ON DELETE CASCADE;


--
-- Name: tours tours_seo_og_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_seo_og_image_id_media_id_fk FOREIGN KEY (seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict uq1AnIewlh1kTmioAeDz5QSsahwsFaWES43CZ7mncVSodYCxbvZnWRgKRK49xRp

