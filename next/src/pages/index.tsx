import type {GetServerSideProps} from "next";

export const getServerSideProps = (async () => {
  return {
    redirect: {
      destination: "/w4",
      permanent: false,
    },
  };
}) satisfies GetServerSideProps;

function Index() {
  return null;
}

export default Index;
