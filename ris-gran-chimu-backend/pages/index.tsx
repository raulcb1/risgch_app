import Head from "next/head";
import Link from "next/link";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <>
      <Head>
        <title>Backend RIS Gran Chimú</title>
        <meta
          name="description"
          content="Proyecto backend del Sistema RIS Gran Chimú"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.container}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>
            Proyecto Backend — RIS Gran Chimú
          </h1>

          <p className={styles.description}>
            Este es el entorno backend del sistema <strong>Red Integrada de Salud Gran Chimú</strong>,
            desarrollado para la gestión eficiente de información médica y
            administrativa.
          </p>

          <h3>Ver documentación en:</h3>
          <h3>
            <Link
              href="/apidocs"
              className={styles.link}
            >
              /apidocs
            </Link>
          </h3>

          <p className={styles.footer}>
            © {new Date().getFullYear()} RIS Gran Chimú. Todos los derechos reservados.
          </p>
        </div>
      </main>
    </>
  );
}
