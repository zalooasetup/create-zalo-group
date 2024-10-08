const buttonBuyElm = document.getElementById("buy");
const buttonConfirmElm = document.getElementById("confirm");
const buttonCreateGroupElm = document.getElementById("createGroup");
const selectGmfElm = document.getElementById("select");

const setProductDetails = (item) => {
  const { order_id, product_name, amount, verified_token } = item;

  document.getElementById("orderId").innerText = order_id;
  document.getElementById("name").innerText = product_name;
  document.getElementById(
    "price"
  ).innerText = `${new Intl.NumberFormat().format(amount)} VND`;
  document.getElementById("token").innerText = verified_token;
};

const getProductDetails = () => {
  const order_id = document.getElementById("orderId").innerText;
  const verified_token = document.getElementById("token").innerText;

  return { order_id, verified_token };
};

const getAccessToken = async () => {
  try {
    const params = new URLSearchParams(document.location.search);
    const oaCode = params.get("code");
    const res = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        secret_key: "1s3S3lB7BLgGtCjbYRZa",
      },
      method: "POST",
      body: new URLSearchParams({
        app_id: "655641159607724763",
        code: oaCode || "",
        grant_type: "authorization_code",
      }).toString(),
    });

    const { access_token, error } = await res.json();
    sessionStorage.setItem("accessToken", access_token);

    return access_token;
  } catch (error) {
    console.error(error);
  }
};

const getGMF1000List = async () => {
  try {
    const accessToken =
      sessionStorage.getItem("accessToken") || (await getAccessToken());
    const res = await fetch("https://openapi.zalo.me/v3.0/oa/quota/group", {
      headers: {
        "Content-Type": "application/json",
        access_token: accessToken || "",
      },
      method: "POST",
      body: JSON.stringify({
        quota_owner: "OA",
        product_type: "gmf1000",
        quota_type: "purchase_quota",
      }),
    });

    const { data, error, message } = await res.json();

    if (error) throw new Error(error);

    if (message === "Success") {
      const notUsedItems = data?.filter((item) => item.status !== "used");
      const quantity = notUsedItems?.length || 0;

      if (quantity) buttonCreateGroupElm.disabled = false;

      document.getElementById("quantity").innerText = quantity;

      return notUsedItems;
    }

    return [];
  } catch (err) {
    console.error(err);
  }
};
getGMF1000List();

const createOrder = async () => {
  try {
    buttonBuyElm.disabled = true;

    const selectedProductValue = selectGmfElm.value;
    const accessToken =
      sessionStorage.getItem("accessToken") || (await getAccessToken());

    const res = await fetch(
      "https://openapi.zalo.me/v3.0/oa/purchase/create_order",
      {
        headers: {
          "Content-Type": "application/json",
          access_token: accessToken || "",
        },
        method: "POST",
        body: JSON.stringify({
          beneficiary: "OA",
          product_id: selectedProductValue,
        }),
      }
    );
    const { data, error, message } = await res.json();
    document.getElementById("createInvoiceMessage").innerText = message;

    if (error) throw new Error(error);

    if (message === "Success") {
      setProductDetails(data);
      buttonConfirmElm.disabled = false;
    }

    return data;
  } catch (err) {
    console.error(err);
  } finally {
    buttonBuyElm.disabled = false;

    setTimeout(() => {
      document.getElementById("createInvoiceMessage").innerText = "";
    }, 5000);
  }
};

const confirmOrder = async () => {
  try {
    buttonConfirmElm.disabled = true;
    const accessToken =
      sessionStorage.getItem("accessToken") || (await getAccessToken());
    const params = getProductDetails();

    const res = await fetch(
      "https://openapi.zalo.me/v3.0/oa/purchase/confirm_order",
      {
        headers: {
          "Content-Type": "application/json",
          access_token: accessToken || "",
        },
        method: "POST",
        body: JSON.stringify(params),
      }
    );
    const { data, error, message } = await res.json();
    document.getElementById("confirmMessage").innerText = message;

    if (error) {
      buttonConfirmElm.disabled = false;
      throw new Error(error);
    }

    if (message === "Success") {
      buttonConfirmElm.innerText = "Thanh toán thành công";
      buttonConfirmElm.classList.add("success");
      buttonConfirmElm.disabled = true;
      setProductDetails({
        order_id: "Chưa có thông tin",
        product_name: "Chưa có thông tin",
        amount: "Chưa có thông tin",
        verified_token: "Chưa có thông tin",
      });

      setTimeout(() => {
        buttonConfirmElm.classList.remove("success");
      }, 5000);
    }

    return data;
  } catch (err) {
    console.error(err);
  } finally {
    await getGMF1000List();
  }
};

const createGMF1000 = async () => {
  try {
    buttonCreateGroupElm.disabled = true;

    const accessToken =
      sessionStorage.getItem("accessToken") || (await getAccessToken());

    const gmf1000List = await getGMF1000List();
    const assetId = gmf1000List.length ? gmf1000List[0].asset_id : 0;
    const groupName =
      document.getElementById("groupName").value || `New Group ${assetId}`;

    const res = await fetch(
      "https://openapi.zalo.me/v3.0/oa/group/creategroupwithoa",
      {
        headers: {
          "Content-Type": "application/json",
          access_token: accessToken || "",
        },
        method: "POST",
        body: JSON.stringify({
          group_name: groupName,
          asset_id: assetId,
          member_user_ids: ["334835329580322934"],
        }),
      }
    );
    const { data, message, error } = await res.json();
    document.getElementById("createGroupMessage").innerText = message;

    return data;
  } catch (err) {
    console.error(err);
  } finally {
    await getGMF1000List();

    setTimeout(() => {
      document.getElementById("createGroupMessage").innerText = "";
    }, 5000);
  }
};

buttonBuyElm.addEventListener("click", createOrder);
buttonConfirmElm.addEventListener("click", confirmOrder);
buttonCreateGroupElm.addEventListener("click", createGMF1000);

document.getElementById("getToken").addEventListener("click", () => {
  sessionStorage.removeItem("accessToken");
});

selectGmfElm.addEventListener("change", (e) => {
  console.log(e.target.value);
  document.getElementById("createInvoiceMessage").innerText = "";
});
