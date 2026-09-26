import type {GetServerSideProps} from "next";

export const getServerSideProps = (async () => {
  return {
    redirect: {
      destination: "/w2",
      permanent: false,
    },
  };
}) satisfies GetServerSideProps;

function Index() {
  return null;
}

export default Index;
