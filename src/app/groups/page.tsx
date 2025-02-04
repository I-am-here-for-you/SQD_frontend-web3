"use client";
import React, { useState, useEffect } from "react";

import Sort from "@/components/groups/groupSearch/sort";
import MyGroup from "@/components/groups/JoinedGroups";
import ViewProgress from "@/components/groups/groupSearch/viewProgress";
import Recruiting from "@/components/groups/groupSearch/recruiting";
import AllGroup from "@/components/groups/allGroups";
import GeneralButton from "@/components/groups/share/generalButton";
import Split_line from "@/components/main/split_line";
import Footer from "@/components/main/footer/footer";
import useLoadingControlStore from "@/store/UI_control/loading";
import useNavbarUIControlStore from "@/store/UI_control/navbar";

export default function Home() {
  const setLoadingState = useLoadingControlStore(
    (state) => state.updateLoadingState
  );

  const setNavbarCurrent = useNavbarUIControlStore((state) => state.updateUrl);
  setNavbarCurrent("groups");
  useEffect(() => {
    document.body.style.overflow = "auto";
    setLoadingState(false);
  }, [setLoadingState]);

  const [scale, setScale] = React.useState<number>(60);
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [enableScale, setEnableScale] = useState<boolean>(true);
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    // Set initial screen width
    setScreenWidth(window.innerWidth);
    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setEnableScale(screenWidth > 1000);
  }, [screenWidth]);

  return (
    <>
      <div className="grouppage_container pt-[120px]">
        <Split_line />
        <div className="mb-[50px]">
          <MyGroup />
        </div>
        <Split_line />
        <h1 className="my-5 text-lg">GROUP SEARCH</h1>
        <Split_line />
        <div className="my-5 lg:flex items-center justify-between sm:grid sm:grid-cols-1">
          <div className="flex justify-between w-[60%] mt-2">
            <Sort />
            {enableScale && (
              <div className="ps-[15px] w-full max-w-[300px]">
                <ViewProgress scale={scale} setScale={setScale} />
              </div>
            )}
            <div>
              <Recruiting />
            </div>
          </div>
          <div className="flex p-[1px] border rounded-full border-black h-[30px] lg:w-[35%] lg:mt-0 sm:w-full mt-[20px]">
            <input
              className="w-full h-full bg-transparent  border border-none outline-none outline-[0px] px-[10px] text-chocolate-main"
              placeholder="SEARCH"
            />
            <button className="bg-chocolate-main text-white w-[100px] rounded-[30px] font-Maxeville hover:opacity-60">
              ENTER
            </button>
          </div>
        </div>
        <AllGroup scale={scale} />
        <div className="flex items-center justify-center mt-5">
          <GeneralButton name={"LOAD  MORE"} />
        </div>
      </div>
      <div
        className="mt-[-400px] bg-cover bg-no-repeat h-[920px] w-full -z-10"
        style={{ backgroundImage: "url('/assets/bg-1.jpg')" }}
      ></div>
      <Footer />
    </>
  );
}
