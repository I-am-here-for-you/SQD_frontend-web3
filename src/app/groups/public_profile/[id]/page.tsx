/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import useActiveWeb3 from "@/hooks/useActiveWeb3";
import { Contract } from "ethers";

import GroupDescription from "@/components/groups/share/groupDescription";
import Image from "next/image";
import Split_line from "@/components/main/split_line";
import Footer from "@/components/main/footer/footer";
import EyeIcon from "@/components/svgs/eye_icon";
import HeartIcon from "@/components/svgs/heart_icon";
import { useRouter } from "next/navigation";
import useLoadingControlStore from "@/store/UI_control/loading";

//import data
import useAPI from "@/hooks/useAPI";
import { IGROUP, IUSER, INFT, IPOST_NEWS, IRequest } from "@/types";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
import NftCard from "@/components/main/cards/nftCard";

const ShareGroupProfile = ({ params }: { params: { id: string } }) => {
  const setLoadingState = useLoadingControlStore(
    (state) => state.updateLoadingState
  );
  useEffect(() => {
    document.body.style.overflow = "auto";
    setLoadingState(false);
  }, [setLoadingState]);
  const router = useRouter();
  function scrollToElement(elementId: string) {
    const element = document.getElementById(elementId);
    if (element) {
      const elementTop = element.getBoundingClientRect().top;
      const windowScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      window.scrollTo({
        top: elementTop - 180 + windowScrollTop,
        behavior: "smooth",
      });
    }
  }

  const [members, setMembers] = useState<IUSER[] | undefined>(undefined);

  const { signIn, isAuthenticated, user } = useAuth();
  const [myGroupData, setMyGroupData] = useState<IGROUP | undefined>(undefined);
  const [nftData, setNftData] = useState<INFT[] | undefined>(undefined);
  const [postNews, setPostNews] = useState<IPOST_NEWS[] | undefined>(undefined);
  const [isAvailableRequest, setIsAvailableRequest] = useState<boolean>(true);
  const api = useAPI();
  const getMyGroupData = async () => {
    const response = await api
      .post(`/api/getGroupId`, { id: params.id })
      .catch((error) => {
        toast.error(error.message);
      });
    setMyGroupData(response?.data);
  };

  const getNftData = async () => {
    const response = await api
      .post("/api/getNftByGroupAndStatus", {
        id: params.id,
        status: "list",
      })
      .catch((error) => {
        toast.error(error.message);
      });
    setNftData(response?.data);
  };

  useEffect(() => {
    getMyGroupData();
    getNftData();
  }, []);

  const usersInfor = async () => {
    if (!myGroupData) return;
    console.log("myGroupData", myGroupData);
    const response = await api
      .post(`/auth/user/getAllMembers`)
      .catch((error) => {
        toast.error(error.message);
      });
    const _all_members = response?.data;
    console.log("_all_members", _all_members);
    const _members = _all_members.filter((_user: IUSER) =>
      myGroupData.member
        .map((_groupUser: any) => _groupUser.id)
        .includes(_user.id)
    );
    console.log("_members", _members);
    setMembers(_members);
    const result_postNews = await api
      .post("/api/getPostByGroupId", {
        id: params.id,
      })
      .catch((error) => {
        toast.error(error.message);
      });
    setPostNews(result_postNews?.data);
  };

  const checkIsAvailableRequest = async () => {
    if (!myGroupData) return;
    if (!user) return;
    let flg = false;

    flg = myGroupData.member.map((_user: any) => _user.id).includes(user.id);
    if (!flg) {
      const result = await api
        .post("/api/getJoinRequestByGroupId", { id: params.id })
        .catch((error) => {
          toast.error(error.message);
        });
      console.log("result for all join request", result?.data);
      console.log("user id", user.id);
      const all_requests: IRequest[] = result?.data;
      flg = all_requests
        .map((_request: IRequest) => _request.userid.toString())
        .includes(user.id);
    }

    setIsAvailableRequest(flg);
  };

  useEffect(() => {
    console.log("here");
    usersInfor();
    checkIsAvailableRequest();
  }, [myGroupData]);

  const requestJoinHandle = async () => {
    const now = new Date();
    const formattedDateTime = now.toISOString();
    const response = await api
      .post(`/api/addJoinRequest`, {
        groupId: params.id,
        userId: user?.id,
        date: formattedDateTime,
      })
      .catch((error) => {
        toast.error(error.message);
      });
    toast.success("Successfully submitted join request!");
    checkIsAvailableRequest();
  };

  return (
    <>
      <div className="pt-[100px] h-full">
        <div
          className="page_container_p40 flex font-Maxeville bg-white"
          id="profile"
        >
          <div className="flex flex-col sm:flex-col md:flex-row lg:flex-row xl:flex-row  md:justify-between w-full">
            <div className="gap-4 grid xl:grid-cols-2 lg:grid-cols-1 xl:w-[50%] xl:min-w-[920px] xs:p-0">
              <div className="mt-5">
                {myGroupData && (
                  <Image
                    src={myGroupData?.avatar}
                    className="w-full aspect-square object-cover"
                    alt="group_avatar"
                    width={300}
                    height={300}
                  />
                )}
              </div>
              <div className="mt-5">
                {members && myGroupData && (
                  <GroupDescription
                    users={members}
                    myGroupData={myGroupData}
                    totalEarning={""}
                  />
                )}
              </div>
            </div>
            <div className="mt-5 xs:flex sm:justify-center xs:justify-center h-[30px] ">
              {!isAvailableRequest && (
                <button
                  className="border border-chocolate-main bg-[#322A44] p-1 text-white rounded-full flex items-center pl-6 pr-6 text-md hover:bg-white hover:text-chocolate-main transition-all"
                  onClick={() => requestJoinHandle()}
                >
                  REQUEST TO JOIN
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="sticky top-[100px] z-10 hidden md:block">
          <nav className="bg-white bg-opacity-95 border-b-[1px] page_container_p40 font-Maxeville">
            <div>
              <div className="flex items-center h-16">
                <div className="flex items-center cursor-pointer">
                  <div className="flex-shrink-0">{/* Logo */}</div>
                  <div className="">
                    <div className="flex items-baseline space-x-4">
                      <a
                        onClick={() => {
                          scrollToElement("profile");
                        }}
                        className="border-b-2 border-transparent hover:border-gray-400 py-2 text-lg"
                      >
                        PROFILE
                      </a>
                      <a
                        onClick={() => {
                          scrollToElement("nfts");
                        }}
                        className="border-b-2 border-transparent hover:border-gray-400 px-3 py-2 text-lg"
                      >
                        NFTs
                      </a>
                      <a
                        onClick={() => {
                          scrollToElement("post");
                        }}
                        className="border-b-2 border-transparent hover:border-gray-400 px-3 py-2 text-lg"
                      >
                        POST
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
        <div className="page_container_p40 font-Maxeville">
          <div className="flex justify-between text-xl mt-5" id="nfts">
            <div>NFTs ({nftData?.length ? nftData?.length : "0"})</div>
            <div className="border-b-2 border-indigo-500"></div>
          </div>
          {nftData?.length == 0 && (
            <div className="w-full flex items-center justify-center min-h-[100px]">
              NO RESULT
            </div>
          )}
          <div className="mb-[50px] grid grid-cols-6 gap-4 mt-5 xl:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 xs:grid-cols-2">
            {nftData?.map((item, index) => (
              <div
                key={index}
                className="relative aspect-square text-md content-card cursor-pointer drop-shadow-md"
                onClick={() => router.push(`/details/public/${item.id}`)}
              >
                <NftCard
                  avatar={item.avatar}
                  collectionName={item.collectionname}
                  collectionId={Number(item.collectionid)}
                  seen={200}
                  favorite={20}
                  price={Number(item.currentprice)}
                />
              </div>
            ))}
          </div>
          <Split_line />

          <div className="flex justify-between text-lg mt-5" id="post">
            <div>POST ({postNews?.length ? postNews?.length : "0"})</div>
            <div className="border-b-2 border-indigo-500">VIEW ALL</div>
          </div>
          {postNews?.length == 0 && (
            <div className="w-full flex items-center justify-center min-h-[100px]">
              NO RESULT
            </div>
          )}
          <div
            style={{ borderBottom: "3px solid #ccc" }}
            className="mt-5 mb-3 w-[26%]"
          ></div>
          <div>
            {postNews &&
              postNews?.map((_news, key) => (
                <div
                  key={key}
                  className="mt-5 gap-5 grid lg:grid-cols-2 xs:grid-cols-1"
                >
                  <div>
                    {_news.content.split("\n").map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                  <div>{_news.post_time.toString()}</div>

                  <Split_line />
                </div>
              ))}
          </div>
        </div>

        <div
          className="mt-[-400px] bg-cover bg-no-repeat h-[920px] w-full -z-10"
          style={{ backgroundImage: "url('/assets/bg-1.jpg')" }}
        ></div>
        <Footer />
      </div>
    </>
  );
};

export default ShareGroupProfile;
